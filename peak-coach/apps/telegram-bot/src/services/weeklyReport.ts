// ============================================
// PEAK COACH - Weekly Report Service
// ============================================

import OpenAI from 'openai';
import { supabase } from './supabase';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// INTERFACES
// ============================================

interface WeeklyStats {
  // Tasks
  tasksCompleted: number;
  tasksTotal: number;
  taskCompletionRate: number;
  
  // Habits
  habitsCompleted: number;
  habitsTotal: number;
  habitCompletionRate: number;
  streaksGained: string[];
  streaksLost: string[];
  
  // Goals
  goalsProgress: Array<{
    title: string;
    progress: number;
    change: number;
  }>;
  goalsCompleted: string[];
  
  // Wellbeing
  avgMood: number;
  avgEnergy: number;
  avgSleep: number;
  sleepDebt: number;
  
  // Work
  totalWorkMinutes: number;
  workDays: number;
  graceDaysUsed: number;
  
  // Patterns
  bestDay: string;
  worstDay: string;
  peakProductivityTime: string;
}

// ============================================
// DATA COLLECTION
// ============================================

export async function getWeeklyStats(userId: string): Promise<WeeklyStats> {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const startDate = formatDate(weekAgo);
  const endDate = formatDate(today);

  // Tasks this week
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, scheduled_date, completed_at')
    .eq('user_id', userId)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate);

  const tasksCompleted = (tasks || []).filter(t => t.status === 'completed').length;
  const tasksTotal = (tasks || []).length;

  // Habits this week
  const { data: habits } = await supabase
    .from('habits')
    .select('id, name, current_streak')
    .eq('user_id', userId)
    .eq('is_active', true);

  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('habit_id, completed, date')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  const habitsTotal = (habits || []).length * 7; // Potential completions
  const habitsCompleted = (habitLogs || []).filter(l => l.completed).length;

  // Goals progress
  const { data: goals } = await supabase
    .from('goals')
    .select('title, current_value, target_value, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  const goalsProgress = (goals || []).map(g => ({
    title: g.title,
    progress: g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0,
    change: 0, // TODO: Compare with last week
  }));

  // Daily logs for wellbeing
  const { data: logs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  const validMoods = (logs || []).filter(l => l.morning_mood).map(l => l.morning_mood);
  const validEnergy = (logs || []).filter(l => l.morning_energy).map(l => l.morning_energy);
  const validSleep = (logs || []).filter(l => l.sleep_hours).map(l => l.sleep_hours);

  const avgMood = validMoods.length ? validMoods.reduce((a, b) => a + b, 0) / validMoods.length : 0;
  const avgEnergy = validEnergy.length ? validEnergy.reduce((a, b) => a + b, 0) / validEnergy.length : 0;
  const avgSleep = validSleep.length ? validSleep.reduce((a, b) => a + b, 0) / validSleep.length : 0;

  // Work stats
  const workLogs = (logs || []).filter(l => l.work_status === 'off_work');
  const totalWorkMinutes = workLogs.reduce((a, b) => a + (b.total_work_minutes || 0), 0);
  const graceDaysUsed = (logs || []).filter(l => l.is_grace_day).length;

  // Find best/worst day by task completion
  const dayStats: Record<string, number> = {};
  (tasks || []).forEach(t => {
    if (t.status === 'completed' && t.scheduled_date) {
      dayStats[t.scheduled_date] = (dayStats[t.scheduled_date] || 0) + 1;
    }
  });

  const days = Object.entries(dayStats);
  const bestDay = days.length ? days.reduce((a, b) => a[1] > b[1] ? a : b)[0] : '';
  const worstDay = days.length ? days.reduce((a, b) => a[1] < b[1] ? a : b)[0] : '';

  return {
    tasksCompleted,
    tasksTotal,
    taskCompletionRate: tasksTotal ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
    habitsCompleted,
    habitsTotal,
    habitCompletionRate: habitsTotal ? Math.round((habitsCompleted / habitsTotal) * 100) : 0,
    streaksGained: [], // TODO: Track streak changes
    streaksLost: [],
    goalsProgress,
    goalsCompleted: [],
    avgMood: Math.round(avgMood * 10) / 10,
    avgEnergy: Math.round(avgEnergy * 10) / 10,
    avgSleep: Math.round(avgSleep * 10) / 10,
    sleepDebt: Math.max(0, (7.5 - avgSleep) * 7),
    totalWorkMinutes,
    workDays: workLogs.length,
    graceDaysUsed,
    bestDay,
    worstDay,
    peakProductivityTime: 'Morgens', // TODO: Analyze task completion times
  };
}

// ============================================
// REPORT GENERATION
// ============================================

export async function generateWeeklyReport(userId: string): Promise<string> {
  const stats = await getWeeklyStats(userId);
  
  // Get user name
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single();

  const name = user?.name || 'Champion';

  // Build stats summary
  const statsSummary = `
WOCHENSTATISTIK:
- Tasks: ${stats.tasksCompleted}/${stats.tasksTotal} erledigt (${stats.taskCompletionRate}%)
- Habits: ${stats.habitsCompleted} Completions (${stats.habitCompletionRate}%)
- Arbeitstage: ${stats.workDays}, Grace Days: ${stats.graceDaysUsed}
- Ø Mood: ${stats.avgMood}/10
- Ø Energie: ${stats.avgEnergy}/10
- Ø Schlaf: ${stats.avgSleep}h ${stats.sleepDebt > 3 ? `(Schlafschuld: ${Math.round(stats.sleepDebt)}h!)` : ''}
- Bester Tag: ${stats.bestDay || 'N/A'}

ZIELE:
${stats.goalsProgress.map(g => `- ${g.title}: ${g.progress}%`).join('\n') || '- Keine aktiven Ziele'}
`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Du bist ein Peak Performance Coach. Erstelle einen Weekly Report für ${name}.

REGELN:
- Deutsch, Du-Form, motivierend aber ehrlich
- Max 400 Wörter
- Struktur: Highlights → Challenges → Empfehlungen für nächste Woche
- Nutze Emojis sparsam (max 5)
- Sei spezifisch, beziehe dich auf die Zahlen
- Ende positiv (Peak-End Rule)`,
        },
        {
          role: 'user',
          content: `Erstelle einen Weekly Report basierend auf diesen Daten:\n${statsSummary}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || getDefaultReport(stats, name);
  } catch (error) {
    logger.error('Error generating weekly report:', error);
    return getDefaultReport(stats, name);
  }
}

function getDefaultReport(stats: WeeklyStats, name: string): string {
  return `📊 *Weekly Report für ${name}*

*Diese Woche:*
✅ ${stats.tasksCompleted}/${stats.tasksTotal} Tasks erledigt (${stats.taskCompletionRate}%)
🔄 ${stats.habitCompletionRate}% Habit-Completion
😊 Ø Mood: ${stats.avgMood}/10
⚡ Ø Energie: ${stats.avgEnergy}/10
😴 Ø Schlaf: ${stats.avgSleep}h

*Fokus für nächste Woche:*
${stats.taskCompletionRate < 70 ? '- Task-Planung verbessern\n' : ''}${stats.avgSleep < 7 ? '- Mehr Schlaf priorisieren\n' : ''}${stats.avgEnergy < 6 ? '- Energie-Management beachten\n' : ''}- Weiter so! 💪`;
}

// ============================================
// SEND REPORT
// ============================================

export async function sendWeeklyReportToUser(userId: string, telegramId: number, bot: any): Promise<boolean> {
  try {
    const report = await generateWeeklyReport(userId);

    await bot.api.sendMessage(
      telegramId,
      `📊 *Dein Weekly Report*\n\n${report}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎯 Ziele', callback_data: 'menu_goals' },
              { text: '📋 Tasks', callback_data: 'menu_tasks' },
            ],
            [{ text: '🏠 Hauptmenü', callback_data: 'show_main_menu' }],
          ],
        },
      }
    );

    logger.info(`Sent weekly report to user ${userId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending weekly report to user ${userId}:`, error);
    return false;
  }
}

