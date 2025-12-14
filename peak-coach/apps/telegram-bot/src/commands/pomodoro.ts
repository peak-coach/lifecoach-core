// ============================================
// PEAK COACH - Pomodoro Timer Command
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';

// ============================================
// MAIN COMMAND
// ============================================

export async function pomodoroCommand(ctx: BotContext) {
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

    await showPomodoroMenu(ctx, user.id);
  } catch (error) {
    logger.error('Error in pomodoro command:', error);
    await ctx.reply('❌ Ein Fehler ist aufgetreten.');
  }
}

// ============================================
// SHOW POMODORO MENU
// ============================================

export async function showPomodoroMenu(ctx: BotContext, userId: string, edit = false) {
  // Check for active session
  const { data: activeSession } = await supabase.rpc('get_active_pomodoro', {
    p_user_id: userId,
  });

  // Get today's stats
  const { data: stats } = await supabase.rpc('get_pomodoro_stats', {
    p_user_id: userId,
    p_days: 1,
  });

  let message = `⏱️ *Pomodoro Timer*\n\n`;

  if (activeSession && activeSession.status === 'active') {
    const remaining = activeSession.remaining_seconds;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    
    message += `🔴 *Aktive Session*\n`;
    message += `⏰ Noch ${mins}:${secs.toString().padStart(2, '0')}\n`;
    if (activeSession.task_title) {
      message += `📋 ${activeSession.task_title}\n`;
    }
    message += `\n`;

    const keyboard = new InlineKeyboard()
      .text('✅ Fertig!', 'pomodoro_complete')
      .text('❌ Abbrechen', 'pomodoro_cancel')
      .row()
      .text('🔄 Aktualisieren', 'pomodoro_refresh')
      .row()
      .text('🏠 Menü', 'show_main_menu');

    if (edit) {
      await ctx.editMessageText(message, { parse_mode: 'Markdown', reply_markup: keyboard });
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: keyboard });
    }
    return;
  }

  if (activeSession && activeSession.status === 'expired') {
    message += `🎉 *Session abgeschlossen!*\n`;
    message += `Zeit für eine kurze Pause.\n\n`;

    const keyboard = new InlineKeyboard()
      .text('✅ Als erledigt markieren', 'pomodoro_complete')
      .row()
      .text('⏱️ Neue Session', 'pomodoro_start_25')
      .row()
      .text('🏠 Menü', 'show_main_menu');

    if (edit) {
      await ctx.editMessageText(message, { parse_mode: 'Markdown', reply_markup: keyboard });
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: keyboard });
    }
    return;
  }

  // No active session
  const todayCount = stats?.today_sessions || 0;
  message += `📊 Heute: ${todayCount} Pomodoro${todayCount !== 1 ? 's' : ''}\n\n`;
  message += `Wähle eine Session-Länge:`;

  const keyboard = new InlineKeyboard()
    .text('🍅 25 Min', 'pomodoro_start_25')
    .text('⏱️ 15 Min', 'pomodoro_start_15')
    .text('🔥 45 Min', 'pomodoro_start_45')
    .row()
    .text('📋 Mit Task', 'pomodoro_select_task')
    .row()
    .text('📊 Statistiken', 'pomodoro_stats')
    .row()
    .text('🏠 Menü', 'show_main_menu');

  if (edit) {
    await ctx.editMessageText(message, { parse_mode: 'Markdown', reply_markup: keyboard });
  } else {
    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: keyboard });
  }
}

// ============================================
// START SESSION
// ============================================

export async function startPomodoro(
  ctx: BotContext, 
  userId: string, 
  duration: number, 
  taskId?: string
) {
  try {
    const { data, error } = await supabase.rpc('start_pomodoro', {
      p_user_id: userId,
      p_task_id: taskId || null,
      p_duration_minutes: duration,
    });

    if (error) throw error;

    const endTime = new Date(data.ends_at);
    const endTimeStr = endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    let message = `🍅 *Pomodoro gestartet!*\n\n`;
    message += `⏱️ ${duration} Minuten\n`;
    message += `⏰ Ende: ${endTimeStr}\n`;
    if (data.task_title) {
      message += `📋 ${data.task_title}\n`;
    }
    message += `\n_Fokus! Ich melde mich wenn die Zeit um ist._`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('✅ Früher fertig', 'pomodoro_complete')
        .text('❌ Abbrechen', 'pomodoro_cancel')
        .row()
        .text('🔄 Status', 'pomodoro_refresh'),
    });

    // Schedule notification (in a real app, use a job queue)
    // For now, we rely on the user checking back
  } catch (error) {
    logger.error('Error starting pomodoro:', error);
    await ctx.answerCallbackQuery('Fehler beim Starten');
  }
}

// ============================================
// COMPLETE SESSION
// ============================================

export async function completePomodoro(ctx: BotContext, userId: string) {
  try {
    const { data, error } = await supabase.rpc('complete_pomodoro', {
      p_user_id: userId,
    });

    if (error) throw error;

    if (!data.success) {
      await ctx.answerCallbackQuery(data.message);
      return;
    }

    let message = `🎉 *Pomodoro abgeschlossen!*\n\n`;
    message += `✅ ${data.duration_minutes} Minuten Fokus\n`;
    if (data.task_title) {
      message += `📋 ${data.task_title}\n`;
    }
    message += `\n📊 Heute: ${data.total_today} Pomodoro${data.total_today !== 1 ? 's' : ''}\n\n`;
    message += `_Zeit für eine ${data.total_today % 4 === 0 ? 'lange (15 Min)' : 'kurze (5 Min)'} Pause!_`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🍅 Nächster Pomodoro', 'pomodoro_start_25')
        .row()
        .text('📋 Tasks', 'menu_tasks')
        .text('🏠 Menü', 'show_main_menu'),
    });

    await ctx.answerCallbackQuery('🎉 Gut gemacht!');
  } catch (error) {
    logger.error('Error completing pomodoro:', error);
    await ctx.answerCallbackQuery('Fehler');
  }
}

// ============================================
// CANCEL SESSION
// ============================================

export async function cancelPomodoro(ctx: BotContext, userId: string) {
  try {
    await supabase
      .from('pomodoro_sessions')
      .update({ status: 'cancelled', ended_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    await ctx.answerCallbackQuery('Session abgebrochen');
    await showPomodoroMenu(ctx, userId, true);
  } catch (error) {
    logger.error('Error cancelling pomodoro:', error);
    await ctx.answerCallbackQuery('Fehler');
  }
}

// ============================================
// SHOW STATS
// ============================================

export async function showPomodoroStats(ctx: BotContext, userId: string) {
  try {
    const { data: weekStats } = await supabase.rpc('get_pomodoro_stats', {
      p_user_id: userId,
      p_days: 7,
    });

    const { data: monthStats } = await supabase.rpc('get_pomodoro_stats', {
      p_user_id: userId,
      p_days: 30,
    });

    let message = `📊 *Pomodoro Statistiken*\n\n`;
    
    message += `*Diese Woche:*\n`;
    message += `🍅 ${weekStats?.total_sessions || 0} Sessions\n`;
    message += `⏱️ ${weekStats?.total_hours || 0}h Fokus\n`;
    message += `📈 Ø ${weekStats?.avg_per_day || 0}/Tag\n\n`;

    message += `*Dieser Monat:*\n`;
    message += `🍅 ${monthStats?.total_sessions || 0} Sessions\n`;
    message += `⏱️ ${monthStats?.total_hours || 0}h Fokus\n`;
    message += `📈 Ø ${monthStats?.avg_per_day || 0}/Tag`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🍅 Session starten', 'pomodoro_start_25')
        .row()
        .text('🔙 Zurück', 'menu_pomodoro')
        .text('🏠 Menü', 'show_main_menu'),
    });
  } catch (error) {
    logger.error('Error showing pomodoro stats:', error);
    await ctx.answerCallbackQuery('Fehler beim Laden');
  }
}

// ============================================
// SELECT TASK FOR POMODORO
// ============================================

export async function showTasksForPomodoro(ctx: BotContext, userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, priority')
      .eq('user_id', userId)
      .eq('scheduled_date', today)
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .limit(5);

    if (!tasks || tasks.length === 0) {
      await ctx.editMessageText(
        `📋 *Keine offenen Tasks für heute*\n\n` +
        `Starte einen Pomodoro ohne Task oder erstelle erst einen Task.`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('🍅 Ohne Task starten', 'pomodoro_start_25')
            .row()
            .text('➕ Task erstellen', 'quick_task_start')
            .row()
            .text('🔙 Zurück', 'menu_pomodoro'),
        }
      );
      return;
    }

    const keyboard = new InlineKeyboard();
    
    tasks.forEach((task, i) => {
      const priorityMap: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
      const priorityEmoji = priorityMap[task.priority] || '🟡';
      const shortTitle = task.title.length > 25 ? task.title.slice(0, 22) + '...' : task.title;
      keyboard.text(`${priorityEmoji} ${shortTitle}`, `pomodoro_task_${task.id}`);
      if (i < tasks.length - 1) keyboard.row();
    });

    keyboard.row().text('🔙 Zurück', 'menu_pomodoro');

    await ctx.editMessageText(
      `📋 *Task für Pomodoro wählen*\n\n_Wähle einen Task für fokussierte Arbeit:_`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    logger.error('Error showing tasks for pomodoro:', error);
    await ctx.answerCallbackQuery('Fehler');
  }
}

