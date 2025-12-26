// ============================================
// PEAK COACH - /start Command (German + Buttons)
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';
import { formatDate } from '../utils/helpers';

// Work Mode Types
export type WorkMode = 'focus' | 'working' | 'off_work' | 'not_started';

// Task/Habit counts for dynamic display
export interface MenuCounts {
  openTasks?: number;
  totalTasks?: number;
  completedHabits?: number;
  totalHabits?: number;
}

// ============================================
// 🎯 ULTRA-CLEAN HAUPTMENÜ
// ============================================

export function getMainMenuKeyboard(
  workMode: WorkMode = 'not_started',
  counts?: MenuCounts
) {
  const keyboard = new InlineKeyboard();
  
  // === TAGES-STATUS (kontextabhängig) ===
  if (workMode === 'not_started') {
    keyboard.text('☀️ Tag starten', 'start_day_flow').row();
  } else if (workMode === 'working') {
    keyboard
      .text('💻 → Fokus', 'switch_to_focus')
      .text('🏠 Feierabend', 'confirm_feierabend_quick')
      .row();
  } else if (workMode === 'focus') {
    keyboard
      .text('🏗️ → Arbeit', 'switch_to_working')
      .text('🏠 Feierabend', 'confirm_feierabend_quick')
      .row();
  } else {
    keyboard.text('☀️ Neuer Tag', 'start_day_flow').row();
  }

  // === HEUTE (Kernfunktionen) ===
  const taskLabel = counts?.openTasks !== undefined 
    ? `📋 Tasks (${counts.openTasks})` 
    : '📋 Tasks';
  const habitLabel = counts?.totalHabits !== undefined 
    ? `🔄 Habits (${counts.completedHabits || 0}/${counts.totalHabits})` 
    : '🔄 Habits';

  keyboard
    .text(taskLabel, 'menu_tasks')
    .text(habitLabel, 'menu_habits')
    .row();

  // === SCHNELL-AKTIONEN ===
  keyboard
    .text('⚡ +Task', 'quick_task_start')
    .text('🍅 Focus', 'menu_pomodoro')
    .row();

  // === MEHR (alles andere) ===
  keyboard.text('📁 Mehr...', 'menu_more').row();

  return keyboard;
}

// ============================================
// 📁 "MEHR" UNTERMENÜ
// ============================================

export function getMoreMenuKeyboard() {
  return new InlineKeyboard()
    .text('🎯 Ziele & Milestones', 'menu_goals')
    .row()
    .text('📊 Statistiken', 'menu_stats')
    .text('💬 Coach', 'menu_coach')
    .row()
    .text('⚙️ Einstellungen', 'menu_settings')
    .row()
    .text('🔙 Zurück', 'show_main_menu');
}

// ============================================
// START COMMAND
// ============================================

export async function startCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  const firstName = ctx.from?.first_name || 'Champion';

  if (!telegramId) {
    await ctx.reply('❌ Konnte deine Telegram ID nicht ermitteln.');
    return;
  }

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (existingUser) {
      // Returning user - get today's status
      const hour = new Date().getHours();
      let greeting = 'Guten Tag';
      let emoji = '👋';
      if (hour < 12) { greeting = 'Guten Morgen'; emoji = '☀️'; }
      else if (hour >= 18) { greeting = 'Guten Abend'; emoji = '🌙'; }

      // Get today's work status
      let workMode: WorkMode = 'not_started';
      let dayType = 'normal';
      
      try {
        const today = formatDate(new Date());
        const { data: workStatus } = await supabase
          .from('work_status')
          .select('work_mode, day_type')
          .eq('user_id', existingUser.id)
          .eq('date', today)
          .single();
        
        if (workStatus) {
          workMode = workStatus.work_mode || 'not_started';
          dayType = workStatus.day_type || 'normal';
        }
      } catch (e) {
        // Ignore - use default
      }

      // Get today's task stats
      const today = formatDate(new Date());
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', existingUser.id)
        .eq('scheduled_date', today);
      
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const openTasks = totalTasks - completedTasks;

      // Get today's habit stats
      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('is_active', true);
      
      const { data: habitLogs } = await supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('date', today)
        .eq('completed', true);
      
      const totalHabits = habits?.length || 0;
      const completedHabits = habitLogs?.length || 0;

      // Menu counts for dynamic labels
      const menuCounts: MenuCounts = {
        openTasks,
        totalTasks,
        completedHabits,
        totalHabits,
      };

      // Build status message
      let statusEmoji = '';
      let statusText = '';
      
      switch (workMode) {
        case 'working':
          statusEmoji = '🏗️';
          statusText = 'Arbeitszeit';
          break;
        case 'focus':
          statusEmoji = '💻';
          statusText = 'Fokuszeit';
          break;
        case 'off_work':
          statusEmoji = '🏠';
          statusText = 'Feierabend';
          break;
        default:
          statusEmoji = '⏳';
          statusText = 'Tag noch nicht gestartet';
      }

      const dayTypeEmoji = {
        normal: '',
        montage: ' 🔧',
        recovery: ' 🧘',
        urlaub: ' 🏖️',
        krank: ' 🤒',
      }[dayType] || '';

      // Build clean status message
      let statusLine = `${statusEmoji} ${statusText}${dayTypeEmoji}`;
      
      await ctx.reply(
        `${emoji} ${greeting}, ${firstName}!\n\n` +
        `${statusLine}\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Was möchtest du tun?`,
        {
          parse_mode: 'Markdown',
          reply_markup: getMainMenuKeyboard(workMode, menuCounts),
        }
      );
    } else {
      // New user - create account
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          name: firstName,
          timezone: 'Europe/Berlin',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating user:', error);
        await ctx.reply('❌ Fehler beim Erstellen deines Accounts. Bitte versuche es erneut.');
        return;
      }

      // Create default profile
      await supabase
        .from('user_profile')
        .insert({
          user_id: newUser.id,
          coach_style: 'balanced',
          notification_frequency: 'normal',
        });

      await ctx.reply(
        `🏆 *Willkommen bei Peak Performance Coach!*\n\n` +
        `Hey ${firstName}! 👋\n\n` +
        `Ich bin dein persönlicher KI-Coach und helfe dir:\n\n` +
        `🎯 Deine Ziele zu erreichen\n` +
        `📈 Produktiver zu werden\n` +
        `💪 Bessere Gewohnheiten aufzubauen\n` +
        `🧠 Den besten Weg für jedes Ziel zu finden\n\n` +
        `_Dein Account wurde erstellt!_`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('🚀 Los geht\'s!', 'onboarding_start')
            .row()
            .text('📖 Später einrichten', 'show_main_menu'),
        }
      );
    }
  } catch (error) {
    logger.error('Error in start command:', error);
    await ctx.reply('❌ Ein Fehler ist aufgetreten. Bitte versuche /start erneut.');
  }
}
