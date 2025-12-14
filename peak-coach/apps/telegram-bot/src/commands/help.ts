// ============================================
// PEAK COACH - Help Command
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';

export async function helpCommand(ctx: BotContext) {
  await ctx.reply(
    `❓ *Hilfe - Peak Performance Coach*\n\n` +
    `*Was kann ich für dich tun?*\n\n` +
    `📝 *Check-in*\n` +
    `Morning & Evening Check-ins tracken deine Stimmung, Energie und Schlaf.\n\n` +
    `📋 *Tasks*\n` +
    `Plane und erledige deine täglichen Aufgaben mit Prioritäten und Zeitplanung.\n\n` +
    `🔄 *Habits*\n` +
    `Baue positive Gewohnheiten auf und verfolge deine Streaks.\n\n` +
    `📊 *Statistiken*\n` +
    `Sieh deine Fortschritte und Trends über Zeit.\n\n` +
    `💬 *Coach*\n` +
    `Sprich jederzeit mit deinem AI Coach für Motivation und Unterstützung.\n\n` +
    `*Befehle:*\n` +
    `/start - Hauptmenü\n` +
    `/checkin - Check-in starten\n` +
    `/tasks - Tasks anzeigen\n` +
    `/habits - Habits anzeigen\n` +
    `/stats - Statistiken\n` +
    `/coach - Mit Coach sprechen\n\n` +
    `💡 *Tipp:* Du kannst mir auch einfach eine Nachricht schreiben!`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🏠 Zum Hauptmenü', 'show_main_menu'),
    }
  );
}
