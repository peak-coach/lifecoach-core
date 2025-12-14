// ============================================
// PEAK COACH - Quick Task Command
// ============================================
// Usage: /q <task> or /quick <task>
// Creates a task instantly with defaults (today, medium priority)

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';

export async function quickTaskCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply('❌ Fehler.');
    return;
  }

  // Extract task title from message
  const text = ctx.message?.text || '';
  const match = text.match(/^\/(?:q|quick)\s+(.+)$/i);
  
  if (!match || !match[1]?.trim()) {
    await ctx.reply(
      `⚡ *Quick-Task*\n\n` +
      `Nutze: \`/q Meine schnelle Task\`\n\n` +
      `_Erstellt sofort eine Task für heute mit mittlerer Priorität._`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const title = match[1].trim();

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

    const today = formatDate(new Date());

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title,
        priority: 'medium',
        energy_required: 'medium',
        scheduled_date: today,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    await ctx.reply(
      `⚡ *Task erstellt!*\n\n` +
      `📝 ${title}\n` +
      `📅 Heute • 🟡 Mittel\n\n` +
      `_Weiter geht's!_`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('✅ Erledigt', `task_complete_${task.id}`)
          .text('📋 Alle', 'menu_tasks'),
      }
    );
  } catch (error) {
    logger.error('Quick task error:', error);
    await ctx.reply('❌ Fehler beim Erstellen.');
  }
}

