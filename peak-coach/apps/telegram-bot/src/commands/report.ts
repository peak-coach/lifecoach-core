// ============================================
// PEAK COACH - Weekly Report Command
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { generateWeeklyReport, getWeeklyStats } from '../services/weeklyReport';
import { logger } from '../utils/logger';

export async function reportCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('❌ Fehler.');
    return;
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.reply('❌ Nutze /start um zu beginnen.');
      return;
    }

    // Show loading
    const loadingMsg = await ctx.reply('📊 *Generiere Weekly Report...*\n\n_Das dauert einen Moment..._', {
      parse_mode: 'Markdown',
    });

    const report = await generateWeeklyReport(user.id);

    // Delete loading message and send report
    await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
    
    await ctx.reply(
      `📊 *Dein Weekly Report*\n\n${report}`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📋 Tasks', 'menu_tasks')
          .text('🎯 Ziele', 'menu_goals')
          .row()
          .text('📈 Stats', 'menu_stats')
          .text('🏠 Menü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error in report command:', error);
    await ctx.reply('❌ Fehler beim Generieren des Reports.');
  }
}

// Quick stats without AI
export async function quickStatsCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('❌ Fehler.');
    return;
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.reply('❌ Nutze /start um zu beginnen.');
      return;
    }

    const stats = await getWeeklyStats(user.id);

    // Progress bars
    const taskBar = '█'.repeat(Math.round(stats.taskCompletionRate / 10)) + '░'.repeat(10 - Math.round(stats.taskCompletionRate / 10));
    const habitBar = '█'.repeat(Math.round(stats.habitCompletionRate / 10)) + '░'.repeat(10 - Math.round(stats.habitCompletionRate / 10));

    await ctx.reply(
      `📊 *Quick Stats (7 Tage)*\n\n` +
      `*Tasks:*\n${taskBar} ${stats.taskCompletionRate}%\n` +
      `${stats.tasksCompleted}/${stats.tasksTotal} erledigt\n\n` +
      `*Habits:*\n${habitBar} ${stats.habitCompletionRate}%\n` +
      `${stats.habitsCompleted} Completions\n\n` +
      `*Wellbeing:*\n` +
      `😊 Mood: ${stats.avgMood}/10\n` +
      `⚡ Energie: ${stats.avgEnergy}/10\n` +
      `😴 Schlaf: ${stats.avgSleep}h\n` +
      (stats.sleepDebt > 3 ? `⚠️ Schlafschuld: ${Math.round(stats.sleepDebt)}h\n` : '') +
      `\n*Arbeit:*\n` +
      `📅 ${stats.workDays} Arbeitstage\n` +
      `⏱️ ${Math.round(stats.totalWorkMinutes / 60)}h gearbeitet\n` +
      (stats.graceDaysUsed > 0 ? `🛡️ ${stats.graceDaysUsed} Grace Day(s)\n` : ''),
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📊 Full Report', 'generate_weekly_report')
          .row()
          .text('🏠 Menü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error in quick stats command:', error);
    await ctx.reply('❌ Fehler beim Laden der Stats.');
  }
}

