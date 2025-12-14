// ============================================
// PEAK COACH - Work Day Commands
// Feierabend-Button & Tagestypen
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';

// Day type labels in German
const dayTypeLabels: Record<string, { emoji: string; label: string; desc: string }> = {
  normal: { emoji: '💼', label: 'Normal', desc: 'Normaler Arbeitstag' },
  montage: { emoji: '🔧', label: 'Montage', desc: 'Außendienst / Baustelle' },
  recovery: { emoji: '🧘', label: 'Recovery', desc: 'Erholungstag, weniger Druck' },
  vacation: { emoji: '🏖️', label: 'Urlaub', desc: 'Freier Tag' },
  sick: { emoji: '🤒', label: 'Krank', desc: 'Krankheitstag' },
};

// Work status labels
const workStatusLabels: Record<string, { emoji: string; label: string }> = {
  not_started: { emoji: '😴', label: 'Noch nicht gestartet' },
  working: { emoji: '💪', label: 'Bei der Arbeit' },
  break: { emoji: '☕', label: 'Pause' },
  off_work: { emoji: '🏠', label: 'Feierabend' },
};

// Get user by telegram ID
async function getUserByTelegramId(telegramId: number) {
  const { data } = await supabase
    .from('users')
    .select('id, name')
    .eq('telegram_id', telegramId)
    .single();
  return data;
}

// ============================================
// /day Command - Select Day Type
// ============================================
export async function dayCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await ctx.reply('❌ Bitte starte zuerst mit /start');
    return;
  }

  // Get current status
  const { data: status } = await supabase.rpc('get_today_status', {
    p_user_id: user.id
  });

  const currentType = status?.day_type || 'normal';

  const keyboard = new InlineKeyboard();
  
  Object.entries(dayTypeLabels).forEach(([type, info], index) => {
    const isActive = type === currentType;
    keyboard.text(
      `${info.emoji} ${info.label}${isActive ? ' ✓' : ''}`,
      `day_type_${type}`
    );
    if ((index + 1) % 2 === 0) keyboard.row();
  });

  await ctx.reply(
    `📅 *Welcher Tag ist heute?*\n\n` +
    `Aktuell: ${dayTypeLabels[currentType].emoji} ${dayTypeLabels[currentType].label}\n\n` +
    `_Wähle den Tagestyp - der Coach passt sich entsprechend an._`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  );
}

// Handle day type selection callback
export async function handleDayTypeCallback(ctx: BotContext, dayType: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  try {
    // Start work day with selected type
    const { data, error } = await supabase.rpc('start_work_day', {
      p_user_id: user.id,
      p_day_type: dayType
    });

    if (error) throw error;

    const typeInfo = dayTypeLabels[dayType];
    
    let message = `${typeInfo.emoji} *${typeInfo.label}* ausgewählt!\n\n`;
    
    // Different messages based on day type
    switch (dayType) {
      case 'normal':
        message += `💪 Normaler Tag - lass uns produktiv sein!\n\n`;
        message += `_Ich erinnere dich an deine Tasks und Habits._`;
        break;
      case 'montage':
        message += `🔧 Montage-Tag erkannt.\n\n`;
        message += `_Weniger Erinnerungen, Fokus auf das Wesentliche._\n`;
        message += `_Quick-Tasks für zwischendurch erlaubt._`;
        break;
      case 'recovery':
        message += `🧘 Recovery Day - heute geht's um Erholung.\n\n`;
        message += `_Keine Produktivitäts-Push, nur sanfte Erinnerungen._\n`;
        message += `_Fokus auf Selbstfürsorge._`;
        break;
      case 'vacation':
        message += `🏖️ Genieß deinen freien Tag!\n\n`;
        message += `_Ich halte mich zurück - nur wichtige Erinnerungen._`;
        break;
      case 'sick':
        message += `🤒 Gute Besserung!\n\n`;
        message += `_Heute keine Aufgaben - ruh dich aus._`;
        break;
    }

    await ctx.editMessageText(message, { parse_mode: 'Markdown' });
    
    // Show main menu after selection
    setTimeout(async () => {
      await showWorkDayStatus(ctx, user.id);
    }, 1500);

  } catch (error) {
    logger.error('Error setting day type:', error);
    await ctx.reply('❌ Fehler beim Setzen des Tagestyps.');
  }
}

// ============================================
// /feierabend Command - End Work Day
// ============================================
export async function feierabendCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await ctx.reply('❌ Bitte starte zuerst mit /start');
    return;
  }

  // Get current status
  const { data: status } = await supabase.rpc('get_today_status', {
    p_user_id: user.id
  });

  if (status?.work_status === 'off_work') {
    await ctx.reply(
      `🏠 Du hast bereits Feierabend!\n\n` +
      `Genieß deinen Abend. 🌙`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Show confirmation
  await ctx.reply(
    `🏠 *Feierabend machen?*\n\n` +
    `Du beendest deinen Arbeitstag.\n` +
    `Der Coach wechselt in den Abend-Modus.\n\n` +
    `_Nach Feierabend: Weniger Produktivitäts-Push,\nmehr Fokus auf Erholung und Reflexion._`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('✅ Ja, Feierabend!', 'confirm_feierabend')
        .text('❌ Abbrechen', 'cancel_feierabend'),
    }
  );
}

// Handle Feierabend confirmation
export async function handleFeierabendCallback(ctx: BotContext, action: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  if (action === 'cancel') {
    await ctx.editMessageText('👍 Alles klar, weiter geht\'s!');
    return;
  }

  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  try {
    const { data, error } = await supabase.rpc('end_work_day', {
      p_user_id: user.id
    });

    if (error) throw error;

    const workHours = data?.work_hours || 0;
    
    // Get today's stats
    const { data: status } = await supabase.rpc('get_today_status', {
      p_user_id: user.id
    });

    const tasksCompleted = status?.tasks?.completed || 0;
    const tasksTotal = status?.tasks?.total || 0;
    const habitsCompleted = status?.habits?.completed || 0;
    const habitsTotal = status?.habits?.total || 0;

    let message = `🏠 *Feierabend!*\n\n`;
    message += `⏱️ Arbeitszeit heute: *${workHours}h*\n\n`;
    message += `📊 *Tages-Bilanz:*\n`;
    message += `✅ Tasks: ${tasksCompleted}/${tasksTotal}\n`;
    message += `🔄 Habits: ${habitsCompleted}/${habitsTotal}\n\n`;

    // Encouragement based on completion
    const taskRate = tasksTotal > 0 ? tasksCompleted / tasksTotal : 1;
    if (taskRate >= 0.8) {
      message += `🎉 *Super Tag!* Du hast fast alles geschafft.\n`;
    } else if (taskRate >= 0.5) {
      message += `👍 *Solider Tag!* Mehr als die Hälfte erledigt.\n`;
    } else if (tasksTotal > 0) {
      message += `💪 *Morgen ist ein neuer Tag!*\n`;
    }

    message += `\n_Genieß deinen Feierabend! 🌙_`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('📝 Abend-Review', 'start_evening_review')
        .row()
        .text('🏠 Hauptmenü', 'show_main_menu'),
    });

  } catch (error) {
    logger.error('Error ending work day:', error);
    await ctx.reply('❌ Fehler beim Beenden des Arbeitstags.');
  }
}

// ============================================
// /status Command - Show Current Work Status
// ============================================
export async function statusCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await ctx.reply('❌ Bitte starte zuerst mit /start');
    return;
  }

  await showWorkDayStatus(ctx, user.id);
}

// Helper: Show work day status
async function showWorkDayStatus(ctx: BotContext, userId: string) {
  const { data: status } = await supabase.rpc('get_today_status', {
    p_user_id: userId
  });

  if (!status) {
    await ctx.reply('❌ Fehler beim Laden des Status.');
    return;
  }

  const dayInfo = dayTypeLabels[status.day_type] || dayTypeLabels.normal;
  const workInfo = workStatusLabels[status.work_status] || workStatusLabels.not_started;

  let message = `📊 *Dein Tag auf einen Blick*\n\n`;
  message += `📅 Datum: ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}\n`;
  message += `${dayInfo.emoji} Tagestyp: *${dayInfo.label}*\n`;
  message += `${workInfo.emoji} Status: *${workInfo.label}*\n\n`;

  if (status.daily_intention) {
    message += `🎯 Fokus: _"${status.daily_intention}"_\n\n`;
  }

  if (status.morning_mood) {
    message += `😊 Stimmung: ${status.morning_mood}/10\n`;
    message += `⚡ Energie: ${status.morning_energy}/10\n\n`;
  }

  message += `📋 Tasks: ${status.tasks.completed}/${status.tasks.total}\n`;
  message += `🔄 Habits: ${status.habits.completed}/${status.habits.total}\n`;

  // Build keyboard based on current status
  const keyboard = new InlineKeyboard();

  if (status.work_status === 'not_started') {
    keyboard.text('🚀 Tag starten', 'start_work_day');
  } else if (status.work_status === 'working') {
    keyboard.text('🏠 Feierabend', 'confirm_feierabend_quick');
  }
  
  keyboard.row();
  keyboard.text('📋 Tasks', 'menu_tasks');
  keyboard.text('🔄 Habits', 'menu_habits');
  keyboard.row();
  keyboard.text('📅 Tagestyp ändern', 'change_day_type');

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

// ============================================
// Quick Actions Handlers
// ============================================
export async function handleStartWorkDay(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  // Start with normal day type, can be changed
  await supabase.rpc('start_work_day', {
    p_user_id: user.id,
    p_day_type: 'normal'
  });

  await ctx.editMessageText(
    `🚀 *Tag gestartet!*\n\n` +
    `Los geht's! Was steht heute an?\n\n` +
    `_Tipp: Mit /day kannst du den Tagestyp ändern._`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('📅 Tagestyp wählen', 'change_day_type')
        .row()
        .text('📋 Tasks anzeigen', 'menu_tasks')
        .text('📝 Check-in', 'menu_checkin'),
    }
  );
}

