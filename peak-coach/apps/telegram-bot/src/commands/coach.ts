// ============================================
// PEAK COACH - Coach Command
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';

export async function coachCommand(ctx: BotContext) {
  ctx.session.step = 'coach_chat';
  
  await ctx.reply(
    `💬 *Chat mit deinem Coach*\n\n` +
    `Was beschäftigt dich gerade?\n\n` +
    `Schreib mir einfach eine Nachricht oder wähle:`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🎯 Tagesziel besprechen', 'coach_daily_goal')
        .text('💪 Motivation', 'coach_motivation')
        .row()
        .text('🤔 Entscheidungshilfe', 'coach_decision')
        .text('📝 Reflexion', 'coach_reflection')
        .row()
        .text('🔙 Hauptmenü', 'show_main_menu'),
    }
  );
}
