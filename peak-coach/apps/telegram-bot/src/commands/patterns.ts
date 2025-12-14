// ============================================
// PEAK COACH - Patterns Command
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { analyzeUserPatterns, getProductivityProfile } from '../services/patternAnalysis';
import { logger } from '../utils/logger';

export async function patternsCommand(ctx: BotContext) {
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
    const loadingMsg = await ctx.reply(
      '🧠 *Analysiere deine Patterns...*\n\n_Das dauert einen Moment..._',
      { parse_mode: 'Markdown' }
    );

    const patterns = await analyzeUserPatterns(user.id);

    await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    if (patterns.length === 0) {
      await ctx.reply(
        `🧠 *Pattern Analyse*\n\n` +
        `Noch nicht genug Daten für eine Analyse.\n\n` +
        `_Nutze die App mind. 2 Wochen für aussagekräftige Patterns._`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('🏠 Menü', 'show_main_menu'),
        }
      );
      return;
    }

    // Sort by confidence
    const topPatterns = patterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    const patternEmoji: Record<string, string> = {
      sleep_performance: '😴',
      day_of_week: '📅',
      energy_task_match: '⚡',
      streak_behavior: '🔥',
      postponement: '📌',
      mood_productivity: '😊',
      workload: '📋',
    };

    let message = `🧠 *Deine Productivity Patterns*\n\n`;

    topPatterns.forEach((p, i) => {
      const emoji = patternEmoji[p.type] || '📊';
      const confidence = p.confidence >= 80 ? '🟢' : p.confidence >= 60 ? '🟡' : '🔴';
      
      message += `${emoji} *${p.description}*\n`;
      message += `   ${confidence} ${p.confidence}% sicher\n`;
      message += `   💡 _${p.recommendation}_\n\n`;
    });

    message += `\n_Basierend auf deinen letzten 30 Tagen._`;

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('📊 Weekly Report', 'generate_weekly_report')
        .row()
        .text('💬 Coach fragen', 'menu_coach')
        .text('🏠 Menü', 'show_main_menu'),
    });

  } catch (error) {
    logger.error('Error in patterns command:', error);
    await ctx.reply('❌ Fehler bei der Analyse.');
  }
}

