// ============================================
// PEAK COACH - Check-in Command (German + Buttons)
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { logger } from '../utils/logger';

// Mood Keyboard
export function getMoodKeyboard(prefix: string) {
  return new InlineKeyboard()
    .text('😫 Schlecht (1-3)', `${prefix}_mood_2`)
    .text('😐 Okay (4-5)', `${prefix}_mood_5`)
    .row()
    .text('😊 Gut (6-7)', `${prefix}_mood_7`)
    .text('🤩 Super (8-10)', `${prefix}_mood_9`)
    .row()
    .text('🔙 Zurück', 'show_main_menu');
}

// Energy Keyboard
export function getEnergyKeyboard(prefix: string) {
  return new InlineKeyboard()
    .text('🪫 Keine Energie', `${prefix}_energy_2`)
    .text('😴 Müde', `${prefix}_energy_4`)
    .row()
    .text('😐 Normal', `${prefix}_energy_6`)
    .text('⚡ Energiegeladen', `${prefix}_energy_8`)
    .row()
    .text('🔥 Volle Power!', `${prefix}_energy_10`)
    .row()
    .text('🔙 Zurück', 'show_main_menu');
}

// Sleep Hours Keyboard
export function getSleepHoursKeyboard() {
  return new InlineKeyboard()
    .text('😵 < 5 Std', 'morning_sleep_hours_4')
    .text('😪 5-6 Std', 'morning_sleep_hours_5.5')
    .row()
    .text('😊 6-7 Std', 'morning_sleep_hours_6.5')
    .text('😴 7-8 Std', 'morning_sleep_hours_7.5')
    .row()
    .text('🛏️ 8+ Std', 'morning_sleep_hours_9')
    .row()
    .text('🔙 Zurück', 'show_main_menu');
}

// Sleep Quality Keyboard
export function getSleepQualityKeyboard() {
  return new InlineKeyboard()
    .text('😫 Schlecht', 'morning_sleep_quality_3')
    .text('😐 Okay', 'morning_sleep_quality_5')
    .row()
    .text('😊 Gut', 'morning_sleep_quality_7')
    .text('🤩 Perfekt', 'morning_sleep_quality_9')
    .row()
    .text('🔙 Zurück', 'show_main_menu');
}

export async function checkinCommand(ctx: BotContext) {
  const hour = new Date().getHours();
  const isMorning = hour < 14; // Bis 14 Uhr = Morning Check-in

  try {
    if (isMorning) {
      // Morning Check-in
      ctx.session.checkinData = { type: 'morning' };
      ctx.session.step = 'checkin_sleep_quality';

      await ctx.reply(
        `🌅 *Morning Check-in*\n\n` +
        `Guten Morgen! Lass uns deinen Tag richtig starten.\n\n` +
        `Wie hast du *geschlafen*?`,
        {
          parse_mode: 'Markdown',
          reply_markup: getSleepQualityKeyboard(),
        }
      );
    } else {
      // Evening Check-in
      ctx.session.checkinData = { type: 'evening' };
      ctx.session.step = 'checkin_evening_mood';

      await ctx.reply(
        `🌙 *Abend-Reflexion*\n\n` +
        `Zeit, den Tag Revue passieren zu lassen.\n\n` +
        `Wie war dein Tag *insgesamt*?`,
        {
          parse_mode: 'Markdown',
          reply_markup: getMoodKeyboard('evening'),
        }
      );
    }
  } catch (error) {
    logger.error('Error in checkin command:', error);
    await ctx.reply('❌ Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
  }
}

// Start morning check-in (called from button)
export async function startMorningCheckin(ctx: BotContext) {
  ctx.session.checkinData = { type: 'morning' };
  ctx.session.step = 'checkin_sleep_quality';

  await ctx.editMessageText(
    `🌅 *Morning Check-in*\n\n` +
    `Lass uns deinen Tag richtig starten!\n\n` +
    `*Frage 1/4:* Wie hast du geschlafen?`,
    {
      parse_mode: 'Markdown',
      reply_markup: getSleepQualityKeyboard(),
    }
  );
}

// Start evening check-in (called from button)
export async function startEveningCheckin(ctx: BotContext) {
  ctx.session.checkinData = { type: 'evening' };
  ctx.session.step = 'checkin_evening_mood';

  await ctx.editMessageText(
    `🌙 *Abend-Reflexion*\n\n` +
    `Zeit, den Tag Revue passieren zu lassen.\n\n` +
    `Wie war dein Tag insgesamt?`,
    {
      parse_mode: 'Markdown',
      reply_markup: getMoodKeyboard('evening'),
    }
  );
}
