// ============================================
// PEAK COACH - Predictive Suggestions Service
// ============================================
// Suggests tasks, habits, and optimizations based on patterns

import OpenAI from 'openai';
import { supabase } from './supabase';
import { formatDate } from '../utils/helpers';
import { analyzeUserPatterns, getProductivityProfile } from './patternAnalysis';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// INTERFACES
// ============================================

export interface Suggestion {
  type: 'task' | 'habit' | 'optimization' | 'warning';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: Record<string, any>;
}

// ============================================
// SMART SUGGESTIONS
// ============================================

export async function generateSmartSuggestions(userId: string): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  try {
    const patterns = await analyzeUserPatterns(userId);
    const profile = await getProductivityProfile(userId);
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    // Get today's data
    const { data: todayLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', formatDate(today))
      .single();

    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('scheduled_date', formatDate(today));

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    // 1. Day-of-week based suggestions
    const dowPattern = patterns.find(p => p.type === 'day_of_week');
    if (dowPattern) {
      const bestDay = dowPattern.data?.best?.day;
      const worstDay = dowPattern.data?.worst?.day;

      if (dayOfWeek === bestDay) {
        suggestions.push({
          type: 'optimization',
          title: 'Peak Day!',
          description: `${dayNames[dayOfWeek]} ist dein produktivster Tag. Nutze ihn für wichtige Aufgaben!`,
          reason: 'Basierend auf deiner Completion-Rate nach Wochentag',
          priority: 'high',
          actionable: true,
        });
      } else if (dayOfWeek === worstDay) {
        suggestions.push({
          type: 'warning',
          title: 'Challenging Day',
          description: `${dayNames[dayOfWeek]} ist historisch dein schwächster Tag. Plane weniger und einfachere Tasks.`,
          reason: 'Basierend auf deiner Completion-Rate nach Wochentag',
          priority: 'medium',
          actionable: true,
        });
      }
    }

    // 2. Energy-based task adjustment
    if (todayLog?.morning_energy) {
      const energy = todayLog.morning_energy;
      const highPriorityTasks = (todayTasks || []).filter(t => t.priority === 'high' && t.status === 'pending');

      if (energy <= 4 && highPriorityTasks.length > 2) {
        suggestions.push({
          type: 'warning',
          title: 'Energie-Mismatch',
          description: `Du hast ${highPriorityTasks.length} wichtige Tasks aber nur ${energy}/10 Energie. Verschiebe 1-2 auf morgen.`,
          reason: 'Niedrige Energie + viele High-Priority Tasks = schlechte Completion',
          priority: 'high',
          actionable: true,
          data: { taskCount: highPriorityTasks.length, energy },
        });
      }
    }

    // 3. Workload check
    const taskCount = (todayTasks || []).filter(t => t.status === 'pending').length;
    const avgTasks = profile.avgTasksPerDay || 5;

    if (taskCount > avgTasks * 1.5) {
      suggestions.push({
        type: 'warning',
        title: 'Überladen',
        description: `${taskCount} Tasks heute sind mehr als dein Durchschnitt (${Math.round(avgTasks)}). Priorisiere die Top 3.`,
        reason: 'Überladene Tage haben niedrigere Completion-Rates',
        priority: 'medium',
        actionable: true,
      });
    } else if (taskCount < avgTasks * 0.5 && taskCount > 0) {
      suggestions.push({
        type: 'optimization',
        title: 'Kapazität frei',
        description: 'Wenig geplant heute. Perfekt für einen "Frosch-Task" oder Goal-Arbeit.',
        reason: 'Nutze freie Kapazität für wichtige, oft verschobene Aufgaben',
        priority: 'low',
        actionable: true,
      });
    }

    // 4. Goal deadline warnings
    const urgentGoals = (goals || []).filter(g => {
      if (!g.deadline) return false;
      const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
      return daysLeft > 0 && daysLeft <= 5;
    });

    urgentGoals.forEach(goal => {
      const daysLeft = Math.ceil((new Date(goal.deadline!).getTime() - Date.now()) / 86400000);
      const progress = goal.target_value ? (goal.current_value / goal.target_value) * 100 : 0;

      if (progress < 70) {
        suggestions.push({
          type: 'warning',
          title: `Goal Deadline: ${goal.title}`,
          description: `Nur noch ${daysLeft} Tag(e) und ${Math.round(progress)}% erreicht. Sprint-Modus!`,
          reason: 'Deadline-Warnung basierend auf aktuellem Fortschritt',
          priority: 'high',
          actionable: true,
          data: { goalId: goal.id, daysLeft, progress },
        });
      }
    });

    // 5. Sleep deficit suggestion
    const sleepPattern = patterns.find(p => p.type === 'sleep_performance');
    if (todayLog?.sleep_hours && todayLog.sleep_hours < 6 && sleepPattern) {
      suggestions.push({
        type: 'optimization',
        title: 'Schlafdefizit-Tag',
        description: 'Nach wenig Schlaf: Fokus auf max 3 wichtige Tasks, mehr Pausen, früher Feierabend.',
        reason: `Deine Produktivität ist ${Math.round(sleepPattern.data?.difference || 20)}% niedriger nach schlechtem Schlaf`,
        priority: 'high',
        actionable: true,
      });
    }

    // 6. Streak protection
    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, current_streak')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('current_streak', 7);

    const { data: todayHabitLogs } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('date', formatDate(today))
      .eq('completed', true);

    const completedHabitIds = new Set((todayHabitLogs || []).map(l => l.habit_id));
    const endangeredStreaks = (habits || []).filter(h => !completedHabitIds.has(h.id));

    if (endangeredStreaks.length > 0) {
      const biggestStreak = endangeredStreaks.reduce((a, b) => 
        (a.current_streak || 0) > (b.current_streak || 0) ? a : b
      );

      suggestions.push({
        type: 'warning',
        title: 'Streak in Gefahr',
        description: `${biggestStreak.name} (${biggestStreak.current_streak} Tage) noch nicht erledigt!`,
        reason: 'Loss Aversion: Einen aufgebauten Streak zu verlieren ist schmerzhafter als einen neuen aufzubauen',
        priority: 'high',
        actionable: true,
        data: { habitId: biggestStreak.id, streak: biggestStreak.current_streak },
      });
    }

  } catch (error) {
    logger.error('Error generating suggestions:', error);
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================
// AI-POWERED TASK SUGGESTIONS
// ============================================

export async function suggestTasksForGoal(userId: string, goalId: string): Promise<string[]> {
  try {
    const { data: goal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (!goal) return [];

    const daysLeft = goal.deadline 
      ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
      : 30;

    const remaining = goal.target_value 
      ? goal.target_value - (goal.current_value || 0)
      : 0;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Du bist ein Produktivitäts-Coach. Generiere konkrete, actionable Tasks.
Regeln:
- Max 5 Tasks
- Jeder Task sollte in 30-90 Min erledigt sein
- Deutsch
- Nur Task-Titel, keine Beschreibungen
- Format: JSON Array von Strings`,
        },
        {
          role: 'user',
          content: `Generiere Tasks für dieses Ziel:
Titel: ${goal.title}
${goal.description ? `Beschreibung: ${goal.description}` : ''}
${goal.why_important ? `Warum wichtig: ${goal.why_important}` : ''}
Verbleibend: ${remaining} von ${goal.target_value || 'N/A'}
Tage bis Deadline: ${daysLeft}
Kategorie: ${goal.category}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    try {
      return JSON.parse(content);
    } catch {
      // Try to extract from text
      const matches = content.match(/"([^"]+)"/g);
      return matches ? matches.map(m => m.replace(/"/g, '')) : [];
    }
  } catch (error) {
    logger.error('Error suggesting tasks for goal:', error);
    return [];
  }
}

