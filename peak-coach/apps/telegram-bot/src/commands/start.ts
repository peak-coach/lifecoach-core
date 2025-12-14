// ============================================
// PEAK COACH - /start Command (German + Buttons)
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';

// Haupt-Menü Keyboard
export function getMainMenuKeyboard(workStatus?: string) {
  const keyboard = new InlineKeyboard();
  
  // Show day start or feierabend button based on status
  if (workStatus === 'working') {
    keyboard.text('🏠 Feierabend', 'confirm_feierabend_quick');
  } else if (workStatus === 'not_started' || !workStatus) {
    keyboard.text('🚀 Tag starten', 'start_work_day');
  }
  keyboard.text('📅 Tagestyp', 'change_day_type');
  keyboard.row();
  
  keyboard
    .text('⚡ Quick-Task', 'quick_task_start')
    .text('🍅 Pomodoro', 'menu_pomodoro')
    .row()
    .text('📋 Tasks', 'menu_tasks')
    .text('🔄 Habits', 'menu_habits')
    .row()
    .text('🎯 Ziele', 'menu_goals')
    .text('💬 Coach', 'menu_coach')
    .row()
    .text('🧠 Insights', 'show_smart_insights')
    .text('⚙️ Settings', 'menu_settings');
    
  return keyboard;
}

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
      // Returning user - get today's status and show main menu
      const hour = new Date().getHours();
      let greeting = 'Guten Tag';
      if (hour < 12) greeting = 'Guten Morgen';
      else if (hour >= 18) greeting = 'Guten Abend';

      // Get today's work status
      let workStatus = 'not_started';
      try {
        const { data: status } = await supabase.rpc('get_today_status', {
          p_user_id: existingUser.id
        });
        if (status) {
          workStatus = status.work_status || 'not_started';
        }
      } catch (e) {
        // Ignore - use default
      }

      // Build status line
      let statusLine = '';
      if (workStatus === 'working') {
        statusLine = '\n💼 _Du bist aktuell bei der Arbeit_\n';
      } else if (workStatus === 'off_work') {
        statusLine = '\n🏠 _Feierabend - genieß deinen Abend!_\n';
      }

      await ctx.reply(
        `${greeting}, ${firstName}! 👋\n\n` +
        `🏆 *Peak Performance Coach*${statusLine}\n` +
        `Was möchtest du tun?`,
        {
          parse_mode: 'Markdown',
          reply_markup: getMainMenuKeyboard(workStatus),
        }
      );
    } else {
      // New user - create account and start onboarding
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
        `✅ Deine Ziele zu erreichen\n` +
        `✅ Produktiver zu werden\n` +
        `✅ Bessere Gewohnheiten aufzubauen\n` +
        `✅ Dich selbst besser kennenzulernen\n\n` +
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
