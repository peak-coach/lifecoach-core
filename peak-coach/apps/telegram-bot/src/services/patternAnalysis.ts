// ============================================
// PEAK COACH - Pattern Analysis Service
// ============================================
// Analyzes user behavior patterns for smarter coaching

import { supabase } from './supabase';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';

// ============================================
// INTERFACES
// ============================================

export interface UserPattern {
  type: string;
  description: string;
  confidence: number; // 0-100
  recommendation: string;
  data: Record<string, any>;
}

export interface ProductivityProfile {
  peakHours: number[];           // Hours with highest completion
  lowEnergyDays: string[];       // Days of week with low energy
  avgTasksPerDay: number;
  completionRateByPriority: Record<string, number>;
  habitSuccessRate: number;
  sleepImpactScore: number;      // How much sleep affects performance
  streakBehavior: 'maintainer' | 'builder' | 'inconsistent';
  bestDayOfWeek: string;
  worstDayOfWeek: string;
}

// ============================================
// PATTERN DETECTION
// ============================================

export async function analyzeUserPatterns(userId: string): Promise<UserPattern[]> {
  const patterns: UserPattern[] = [];
  
  // Get last 30 days of data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = formatDate(thirtyDaysAgo);

  // Fetch all relevant data
  const [logs, tasks, habits, habitLogs] = await Promise.all([
    supabase.from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .order('date', { ascending: false }),
    supabase.from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_date', startDate),
    supabase.from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase.from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate),
  ]);

  const dailyLogs = logs.data || [];
  const allTasks = tasks.data || [];
  const allHabits = habits.data || [];
  const allHabitLogs = habitLogs.data || [];

  // 1. Sleep-Performance Correlation
  const sleepPattern = analyzeSleepPerformance(dailyLogs, allTasks);
  if (sleepPattern) patterns.push(sleepPattern);

  // 2. Day-of-Week Productivity
  const dowPattern = analyzeDayOfWeekProductivity(allTasks);
  if (dowPattern) patterns.push(dowPattern);

  // 3. Energy-Task Matching
  const energyPattern = analyzeEnergyTaskMatch(dailyLogs, allTasks);
  if (energyPattern) patterns.push(energyPattern);

  // 4. Habit Streak Behavior
  const streakPattern = analyzeStreakBehavior(allHabits, allHabitLogs);
  if (streakPattern) patterns.push(streakPattern);

  // 5. Task Postponement Pattern
  const postponePattern = analyzePostponement(allTasks);
  if (postponePattern) patterns.push(postponePattern);

  // 6. Mood-Productivity Correlation
  const moodPattern = analyzeMoodProductivity(dailyLogs, allTasks);
  if (moodPattern) patterns.push(moodPattern);

  // 7. Workload Pattern
  const workloadPattern = analyzeWorkload(allTasks);
  if (workloadPattern) patterns.push(workloadPattern);

  return patterns;
}

// ============================================
// INDIVIDUAL PATTERN ANALYZERS
// ============================================

function analyzeSleepPerformance(logs: any[], tasks: any[]): UserPattern | null {
  if (logs.length < 7) return null;

  const daysWithSleep = logs.filter(l => l.sleep_hours);
  if (daysWithSleep.length < 5) return null;

  // Group by sleep quality
  const goodSleepDays = daysWithSleep.filter(l => l.sleep_hours >= 7);
  const badSleepDays = daysWithSleep.filter(l => l.sleep_hours < 6);

  // Calculate completion rates
  const getCompletionRate = (dates: string[]) => {
    const dayTasks = tasks.filter(t => dates.includes(t.scheduled_date));
    if (dayTasks.length === 0) return 0;
    return dayTasks.filter(t => t.status === 'completed').length / dayTasks.length * 100;
  };

  const goodSleepRate = getCompletionRate(goodSleepDays.map(d => d.date));
  const badSleepRate = getCompletionRate(badSleepDays.map(d => d.date));

  const difference = goodSleepRate - badSleepRate;

  if (difference > 15) {
    return {
      type: 'sleep_performance',
      description: `Deine Produktivität ist ${Math.round(difference)}% höher nach gutem Schlaf (7h+)`,
      confidence: Math.min(90, 50 + daysWithSleep.length * 2),
      recommendation: 'Priorisiere 7+ Stunden Schlaf vor wichtigen Tagen',
      data: { goodSleepRate, badSleepRate, difference },
    };
  }

  return null;
}

function analyzeDayOfWeekProductivity(tasks: any[]): UserPattern | null {
  if (tasks.length < 14) return null;

  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const dayStats: Record<number, { completed: number; total: number }> = {};

  tasks.forEach(task => {
    const day = new Date(task.scheduled_date).getDay();
    if (!dayStats[day]) dayStats[day] = { completed: 0, total: 0 };
    dayStats[day].total++;
    if (task.status === 'completed') dayStats[day].completed++;
  });

  const rates = Object.entries(dayStats)
    .filter(([_, stats]) => stats.total >= 3)
    .map(([day, stats]) => ({
      day: parseInt(day),
      rate: (stats.completed / stats.total) * 100,
      total: stats.total,
    }))
    .sort((a, b) => b.rate - a.rate);

  if (rates.length < 3) return null;

  const best = rates[0];
  const worst = rates[rates.length - 1];

  if (best.rate - worst.rate > 20) {
    return {
      type: 'day_of_week',
      description: `${dayNames[best.day]} ist dein produktivster Tag (${Math.round(best.rate)}%), ${dayNames[worst.day]} der schwächste (${Math.round(worst.rate)}%)`,
      confidence: Math.min(85, 50 + rates.reduce((a, b) => a + b.total, 0)),
      recommendation: `Plane wichtige Tasks auf ${dayNames[best.day]}, nutze ${dayNames[worst.day]} für Routineaufgaben`,
      data: { best, worst, allRates: rates },
    };
  }

  return null;
}

function analyzeEnergyTaskMatch(logs: any[], tasks: any[]): UserPattern | null {
  const logsWithEnergy = logs.filter(l => l.morning_energy);
  if (logsWithEnergy.length < 7) return null;

  // High energy days vs high priority task completion
  const highEnergyDays = logsWithEnergy.filter(l => l.morning_energy >= 7).map(l => l.date);
  const lowEnergyDays = logsWithEnergy.filter(l => l.morning_energy <= 4).map(l => l.date);

  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  
  const highEnergyHighPriority = highPriorityTasks.filter(t => 
    highEnergyDays.includes(t.scheduled_date) && t.status === 'completed'
  ).length;
  
  const lowEnergyHighPriority = highPriorityTasks.filter(t => 
    lowEnergyDays.includes(t.scheduled_date) && t.status === 'completed'
  ).length;

  const totalHighEnergy = highPriorityTasks.filter(t => highEnergyDays.includes(t.scheduled_date)).length;
  const totalLowEnergy = highPriorityTasks.filter(t => lowEnergyDays.includes(t.scheduled_date)).length;

  if (totalHighEnergy < 3 || totalLowEnergy < 3) return null;

  const highEnergyRate = (highEnergyHighPriority / totalHighEnergy) * 100;
  const lowEnergyRate = (lowEnergyHighPriority / totalLowEnergy) * 100;

  if (highEnergyRate - lowEnergyRate > 25) {
    return {
      type: 'energy_task_match',
      description: `Wichtige Tasks gelingen ${Math.round(highEnergyRate - lowEnergyRate)}% besser an Hoch-Energie Tagen`,
      confidence: 75,
      recommendation: 'Verschiebe High-Priority Tasks auf Tage mit guter Energie',
      data: { highEnergyRate, lowEnergyRate },
    };
  }

  return null;
}

function analyzeStreakBehavior(habits: any[], habitLogs: any[]): UserPattern | null {
  if (habits.length === 0) return null;

  const maxStreak = Math.max(...habits.map(h => h.longest_streak || 0));
  const avgStreak = habits.reduce((a, b) => a + (b.current_streak || 0), 0) / habits.length;
  
  // Count streak breaks
  const streakBreaks = habits.filter(h => 
    h.longest_streak > h.current_streak && h.current_streak < 3
  ).length;

  let behavior: 'maintainer' | 'builder' | 'inconsistent';
  let description: string;
  let recommendation: string;

  if (maxStreak > 14 && avgStreak > 5) {
    behavior = 'maintainer';
    description = 'Du bist gut darin, Streaks aufzubauen und zu halten';
    recommendation = 'Nutze Habit Stacking um neue Gewohnheiten an bestehende zu knüpfen';
  } else if (maxStreak > 7 && streakBreaks > habits.length / 2) {
    behavior = 'builder';
    description = 'Du baust Streaks auf, aber verlierst sie oft nach 1-2 Wochen';
    recommendation = 'Setze dir einen "Nie 2x hintereinander verpassen" Regel statt perfekte Streaks';
  } else {
    behavior = 'inconsistent';
    description = 'Deine Habit-Streaks sind noch kurz - das ist normal am Anfang';
    recommendation = 'Starte mit nur 1-2 Habits und mache sie so klein wie möglich (2-Minuten-Regel)';
  }

  return {
    type: 'streak_behavior',
    description,
    confidence: 70,
    recommendation,
    data: { behavior, maxStreak, avgStreak, streakBreaks },
  };
}

function analyzePostponement(tasks: any[]): UserPattern | null {
  const postponedTasks = tasks.filter(t => t.times_postponed > 0);
  if (postponedTasks.length < 5) return null;

  const avgPostpones = postponedTasks.reduce((a, b) => a + b.times_postponed, 0) / postponedTasks.length;
  const chronicPostponers = postponedTasks.filter(t => t.times_postponed >= 3);
  
  // Check which types get postponed most
  const byPriority = {
    high: postponedTasks.filter(t => t.priority === 'high').length,
    medium: postponedTasks.filter(t => t.priority === 'medium').length,
    low: postponedTasks.filter(t => t.priority === 'low').length,
  };

  if (chronicPostponers.length > postponedTasks.length * 0.3) {
    return {
      type: 'postponement',
      description: `${chronicPostponers.length} Tasks wurden 3+ mal verschoben - das sind oft "Frosch-Tasks"`,
      confidence: 80,
      recommendation: 'Eat the Frog: Erledige diese Tasks morgens als erstes, oder breche sie in kleinere Schritte',
      data: { chronicPostponers: chronicPostponers.length, avgPostpones, byPriority },
    };
  }

  return null;
}

function analyzeMoodProductivity(logs: any[], tasks: any[]): UserPattern | null {
  const logsWithMood = logs.filter(l => l.morning_mood);
  if (logsWithMood.length < 10) return null;

  const goodMoodDays = logsWithMood.filter(l => l.morning_mood >= 7).map(l => l.date);
  const badMoodDays = logsWithMood.filter(l => l.morning_mood <= 4).map(l => l.date);

  const getRate = (dates: string[]) => {
    const dayTasks = tasks.filter(t => dates.includes(t.scheduled_date));
    if (dayTasks.length === 0) return 0;
    return dayTasks.filter(t => t.status === 'completed').length / dayTasks.length * 100;
  };

  const goodMoodRate = getRate(goodMoodDays);
  const badMoodRate = getRate(badMoodDays);

  if (goodMoodRate - badMoodRate > 20 && badMoodDays.length >= 3) {
    return {
      type: 'mood_productivity',
      description: `Stimmung beeinflusst deine Produktivität stark (${Math.round(goodMoodRate - badMoodRate)}% Unterschied)`,
      confidence: 70,
      recommendation: 'An schlechten Tagen: Kleinere Tasks, mehr Pausen, Self-Compassion',
      data: { goodMoodRate, badMoodRate },
    };
  }

  return null;
}

function analyzeWorkload(tasks: any[]): UserPattern | null {
  if (tasks.length < 14) return null;

  // Group by date
  const tasksByDate: Record<string, any[]> = {};
  tasks.forEach(t => {
    if (!tasksByDate[t.scheduled_date]) tasksByDate[t.scheduled_date] = [];
    tasksByDate[t.scheduled_date].push(t);
  });

  const dailyCounts = Object.values(tasksByDate).map(t => t.length);
  const avgTasks = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
  
  // Find overloaded days
  const overloadedDays = Object.entries(tasksByDate)
    .filter(([_, t]) => t.length > avgTasks * 1.5)
    .map(([date, t]) => ({
      date,
      count: t.length,
      completed: t.filter(task => task.status === 'completed').length,
    }));

  if (overloadedDays.length > 3) {
    const avgCompletionOverloaded = overloadedDays.reduce((a, b) => a + b.completed / b.count, 0) / overloadedDays.length * 100;
    
    return {
      type: 'workload',
      description: `Du überlädst oft Tage mit ${Math.round(avgTasks * 1.5)}+ Tasks (Completion dann nur ${Math.round(avgCompletionOverloaded)}%)`,
      confidence: 75,
      recommendation: `Limitiere auf max ${Math.ceil(avgTasks)} Tasks pro Tag für bessere Completion`,
      data: { avgTasks, overloadedDays: overloadedDays.length, avgCompletionOverloaded },
    };
  }

  return null;
}

// ============================================
// PRODUCTIVITY PROFILE
// ============================================

export async function getProductivityProfile(userId: string): Promise<ProductivityProfile> {
  const patterns = await analyzeUserPatterns(userId);
  
  // Extract from patterns
  const dowPattern = patterns.find(p => p.type === 'day_of_week');
  const streakPattern = patterns.find(p => p.type === 'streak_behavior');
  const sleepPattern = patterns.find(p => p.type === 'sleep_performance');

  return {
    peakHours: [9, 10, 11], // TODO: Analyze from task completion times
    lowEnergyDays: [], // TODO: Extract from patterns
    avgTasksPerDay: patterns.find(p => p.type === 'workload')?.data?.avgTasks || 5,
    completionRateByPriority: { high: 0, medium: 0, low: 0 }, // TODO
    habitSuccessRate: 0, // TODO
    sleepImpactScore: sleepPattern?.data?.difference || 0,
    streakBehavior: streakPattern?.data?.behavior || 'inconsistent',
    bestDayOfWeek: dowPattern?.data?.best?.day !== undefined 
      ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][dowPattern.data.best.day] 
      : 'Mo',
    worstDayOfWeek: dowPattern?.data?.worst?.day !== undefined
      ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][dowPattern.data.worst.day]
      : 'Fr',
  };
}

// ============================================
// PATTERN INSIGHTS FOR COACH
// ============================================

export async function getPatternInsightsForCoach(userId: string): Promise<string> {
  const patterns = await analyzeUserPatterns(userId);
  
  if (patterns.length === 0) {
    return 'Noch nicht genug Daten für Pattern-Analyse (mind. 2 Wochen).';
  }

  // Sort by confidence
  const topPatterns = patterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return topPatterns.map(p => 
    `- ${p.description} (${p.confidence}% sicher)\n  → ${p.recommendation}`
  ).join('\n\n');
}

