// ============================================
// PEAK COACH - Stats Command
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';

export async function statsCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('❌ Fehler beim Laden der Statistiken.');
    return;
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.reply(
        '❌ Du bist noch nicht registriert.\n\nNutze /start um zu beginnen.'
      );
      return;
    }

    await showWeeklyStats(ctx, user.id);
  } catch (error) {
    logger.error('Error in stats command:', error);
    await ctx.reply('❌ Ein Fehler ist aufgetreten.');
  }
}

export async function showWeeklyStats(ctx: BotContext, userId: string, edit = false) {
  try {
    // Get this week's data
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', formatDate(weekStart))
      .lte('date', formatDate(today));

    // Get tasks stats
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('user_id', userId)
      .gte('scheduled_date', formatDate(weekStart))
      .lte('scheduled_date', formatDate(today));

    // Get habits stats
    const { data: habits } = await supabase
      .from('habits')
      .select('current_streak, best_streak')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Calculate averages
    const moods = (logs || []).map(l => l.morning_mood).filter(Boolean) as number[];
    const energies = (logs || []).map(l => l.morning_energy).filter(Boolean) as number[];
    const sleeps = (logs || []).map(l => l.sleep_hours).filter(Boolean) as number[];

    const avg = (arr: number[]) => arr.length > 0 
      ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) 
      : '-';

    // Task stats
    const totalTasks = (tasks || []).length;
    const completedTasks = (tasks || []).filter(t => t.status === 'completed').length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Habit stats
    const totalStreaks = (habits || []).reduce((sum, h) => sum + (h.current_streak || 0), 0);
    const bestStreak = Math.max(...(habits || []).map(h => h.best_streak || 0), 0);

    // Create mood trend
    const moodTrend = moods.length >= 2 
      ? (moods[moods.length - 1] > moods[0] ? '📈' : moods[moods.length - 1] < moods[0] ? '📉' : '➡️')
      : '➡️';

    let message = `📊 *Deine Statistiken*\n\n`;
    message += `*Diese Woche (${formatDate(weekStart)} - ${formatDate(today)})*\n\n`;

    // Check-in Stats
    message += `📝 *Check-ins:* ${logs?.length || 0}/7 Tage\n`;
    message += `😊 *Stimmung:* ${avg(moods)}/10 ${moodTrend}\n`;
    message += `⚡ *Energie:* ${avg(energies)}/10\n`;
    message += `😴 *Schlaf:* ${avg(sleeps)}h\n\n`;

    // Task Stats
    message += `📋 *Tasks:*\n`;
    message += `   Erledigt: ${completedTasks}/${totalTasks} (${taskRate}%)\n\n`;

    // Habit Stats
    message += `🔄 *Habits:*\n`;
    message += `   Aktive Streaks: ${totalStreaks} Tage total\n`;
    message += `   Längster Streak: ${bestStreak} Tage\n\n`;

    // Insights
    message += `💡 *Insights:*\n`;
    
    const avgMood = parseFloat(avg(moods));
    const avgEnergy = parseFloat(avg(energies));
    const avgSleep = parseFloat(avg(sleeps));

    if (!isNaN(avgMood)) {
      if (avgMood >= 7) {
        message += `• Deine Stimmung ist top! Weiter so!\n`;
      } else if (avgMood < 5) {
        message += `• Deine Stimmung könnte besser sein. Was brauchst du?\n`;
      }
    }

    if (!isNaN(avgSleep)) {
      if (avgSleep < 7) {
        message += `• Du schläfst weniger als empfohlen (7-9h)\n`;
      } else if (avgSleep >= 7 && avgSleep <= 9) {
        message += `• Dein Schlaf ist optimal! 🌟\n`;
      }
    }

    if (taskRate >= 80) {
      message += `• Starke Task-Performance! 🎯\n`;
    } else if (taskRate < 50 && totalTasks > 0) {
      message += `• Fokus auf weniger, aber wichtigere Tasks?\n`;
    }

    const keyboard = new InlineKeyboard()
      .text('📅 Letzte Woche', 'stats_last_week')
      .text('📆 Monat', 'stats_month')
      .row()
      .text('🔄 Aktualisieren', 'refresh_stats')
      .row()
      .text('🔙 Hauptmenü', 'show_main_menu');

    if (edit && ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    logger.error('Error showing stats:', error);
  }
}
