// ============================================
// PEAK COACH - Tasks Command (German + Full CRUD)
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';

// ============================================
// KEYBOARDS
// ============================================

export function getTasksMenuKeyboard() {
  return new InlineKeyboard()
    .text('➕ Neuer Task', 'task_create_start')
    .text('🔄 Aktualisieren', 'refresh_tasks')
    .row()
    .text('📅 Andere Tage', 'tasks_other_days')
    .text('🔙 Menü', 'show_main_menu');
}

export function getPriorityKeyboard() {
  return new InlineKeyboard()
    .text('🔴 Hoch', 'task_priority_high')
    .text('🟡 Mittel', 'task_priority_medium')
    .text('🟢 Niedrig', 'task_priority_low')
    .row()
    .text('❌ Abbrechen', 'show_main_menu');
}

export function getEnergyKeyboard() {
  return new InlineKeyboard()
    .text('🔥 Viel Energie nötig', 'task_energy_high')
    .text('⚡ Normal', 'task_energy_medium')
    .text('😴 Wenig Energie', 'task_energy_low')
    .row()
    .text('❌ Abbrechen', 'show_main_menu');
}

export function getTaskActionKeyboard(taskId: string) {
  return new InlineKeyboard()
    .text('✅ Erledigt', `task_complete_${taskId}`)
    .text('⏭️ Überspringen', `task_skip_${taskId}`)
    .row()
    .text('📝 Bearbeiten', `task_edit_${taskId}`)
    .text('🗑️ Löschen', `task_delete_${taskId}`)
    .row()
    .text('🔙 Zurück', 'menu_tasks');
}

// ============================================
// MAIN COMMAND
// ============================================

export async function tasksCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('❌ Fehler beim Laden der Tasks.');
    return;
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.reply(
        '❌ Du bist noch nicht registriert.\n\nNutze /start um zu beginnen.'
      );
      return;
    }

    await showTasksList(ctx, user.id);
  } catch (error) {
    logger.error('Error in tasks command:', error);
    await ctx.reply('❌ Ein Fehler ist aufgetreten.');
  }
}

// ============================================
// SHOW TASKS LIST
// ============================================

export async function showTasksList(ctx: BotContext, userId: string, edit = false) {
  const today = formatDate(new Date());
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('scheduled_date', today)
    .order('scheduled_time', { ascending: true, nullsFirst: false })
    .order('priority', { ascending: true });

  if (error) {
    logger.error('Error fetching tasks:', error);
    return;
  }

  const priorityEmoji: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
  const statusEmoji: Record<string, string> = {
    pending: '⬜',
    in_progress: '🔄',
    completed: '✅',
    skipped: '⏭️',
    postponed: '📅',
  };

  let message = `📋 *Heutige Tasks*\n`;
  message += `📅 ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n`;

  if (!tasks || tasks.length === 0) {
    message += `_Keine Tasks für heute geplant._\n\n`;
    message += `💡 Tipp: Plane 1-3 wichtige Tasks für maximale Produktivität!`;
  } else {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    const rate = Math.round((completed / total) * 100);

    // Progress bar
    const progressBars = Math.round(rate / 10);
    const progressBar = '█'.repeat(progressBars) + '░'.repeat(10 - progressBars);
    message += `${progressBar} ${rate}%\n\n`;

    tasks.forEach((task, index) => {
      const status = statusEmoji[task.status] || '⬜';
      const priority = priorityEmoji[task.priority] || '🟡';
      const time = task.scheduled_time ? task.scheduled_time.slice(0, 5) + ' ' : '';
      const strikethrough = task.status === 'completed' ? '~' : '';
      
      message += `${status} ${strikethrough}${time}${task.title}${strikethrough} ${priority}\n`;
    });

    message += `\n📊 *Fortschritt:* ${completed}/${total} Tasks`;
    
    // Motivational message based on progress
    if (rate === 100) {
      message += `\n\n🎉 *Alle Tasks erledigt! Großartige Arbeit!*`;
    } else if (rate >= 75) {
      message += `\n\n💪 Fast geschafft! Nur noch ${total - completed} Task(s)!`;
    } else if (rate >= 50) {
      message += `\n\n👍 Guter Fortschritt! Weiter so!`;
    }
  }

  const keyboard = new InlineKeyboard();
  
  // Add task selection buttons if there are pending tasks
  const pendingTasks = (tasks || []).filter(t => t.status === 'pending' || t.status === 'in_progress');
  if (pendingTasks.length > 0) {
    pendingTasks.slice(0, 5).forEach((task, index) => {
      const shortTitle = task.title.length > 20 ? task.title.slice(0, 17) + '...' : task.title;
      keyboard.text(`${index + 1}. ${shortTitle}`, `task_select_${task.id}`);
      if (index % 2 === 1 || index === pendingTasks.length - 1) keyboard.row();
    });
    keyboard.row();
  }

  keyboard
    .text('➕ Neuer Task', 'task_create_start')
    .text('🔄 Aktualisieren', 'refresh_tasks')
    .row()
    .text('🔁 Wiederkehrend', 'show_recurring_tasks')
    .text('✨ AI generieren', 'generate_daily_tasks')
    .row()
    .text('🔙 Hauptmenü', 'show_main_menu');

  if (edit && ctx.callbackQuery) {
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } else {
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }
}

// ============================================
// CREATE TASK FLOW
// ============================================

export async function startTaskCreation(ctx: BotContext) {
  ctx.session.step = 'task_create_title';
  ctx.session.taskData = {};

  await ctx.editMessageText(
    `➕ *Neuer Task erstellen*\n\n` +
    `Schreibe mir den *Titel* des Tasks:\n\n` +
    `_Beispiel: "Businessplan Kapitel 2 schreiben"_`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('❌ Abbrechen', 'menu_tasks'),
    }
  );
}

export async function handleTaskTitle(ctx: BotContext, title: string) {
  if (!ctx.session.taskData) ctx.session.taskData = {};
  ctx.session.taskData.title = title;
  ctx.session.step = 'task_create_priority';

  await ctx.reply(
    `✅ Titel: *${title}*\n\n` +
    `Welche *Priorität* hat dieser Task?`,
    {
      parse_mode: 'Markdown',
      reply_markup: getPriorityKeyboard(),
    }
  );
}

export async function handleTaskPriority(ctx: BotContext, priority: string) {
  if (!ctx.session.taskData) return;
  ctx.session.taskData.priority = priority;
  ctx.session.step = 'task_create_energy';

  const priorityText = { high: '🔴 Hoch', medium: '🟡 Mittel', low: '🟢 Niedrig' }[priority] || priority;

  await ctx.editMessageText(
    `✅ Priorität: *${priorityText}*\n\n` +
    `Wie viel *Energie* braucht dieser Task?`,
    {
      parse_mode: 'Markdown',
      reply_markup: getEnergyKeyboard(),
    }
  );
}

export async function handleTaskEnergy(ctx: BotContext, energy: string) {
  if (!ctx.session.taskData) return;
  ctx.session.taskData.energy = energy;
  ctx.session.step = 'task_create_time';

  const energyText = { high: '🔥 Viel', medium: '⚡ Normal', low: '😴 Wenig' }[energy] || energy;

  await ctx.editMessageText(
    `✅ Energie: *${energyText}*\n\n` +
    `Wann willst du den Task erledigen?\n\n` +
    `Schreibe eine *Uhrzeit* (z.B. "09:00" oder "14:30")\n` +
    `oder klicke "Ohne Zeit" für flexible Planung.`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('⏰ Ohne Zeit', 'task_time_none')
        .row()
        .text('❌ Abbrechen', 'menu_tasks'),
    }
  );
}

export async function handleTaskTime(ctx: BotContext, time: string | null) {
  if (!ctx.session.taskData) return;
  ctx.session.taskData.time = time;
  
  // Save the task
  await saveTask(ctx);
}

export async function saveTask(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.session.taskData) return;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const taskData = ctx.session.taskData;
    const today = formatDate(new Date());

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: taskData.title,
        priority: taskData.priority || 'medium',
        energy_required: taskData.energy || 'medium',
        scheduled_date: today,
        scheduled_time: taskData.time || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Clear session
    ctx.session.step = undefined;
    ctx.session.taskData = undefined;

    const timeText = taskData.time ? ` um ${taskData.time}` : '';
    
    await ctx.reply(
      `✅ *Task erstellt!*\n\n` +
      `📝 ${taskData.title}${timeText}\n\n` +
      `💪 Los geht's!`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📋 Alle Tasks', 'menu_tasks')
          .text('➕ Noch ein Task', 'task_create_start')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error saving task:', error);
    await ctx.reply('❌ Fehler beim Speichern. Bitte versuche es erneut.');
  }
}

// ============================================
// TASK ACTIONS
// ============================================

export async function selectTask(ctx: BotContext, taskId: string) {
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      await ctx.answerCallbackQuery('Task nicht gefunden');
      return;
    }

    const priorityMap: Record<string, string> = { high: '🔴 Hoch', medium: '🟡 Mittel', low: '🟢 Niedrig' };
    const energyMap: Record<string, string> = { high: '🔥 Viel', medium: '⚡ Normal', low: '😴 Wenig' };
    const statusMap: Record<string, string> = { 
      pending: '⬜ Offen', 
      in_progress: '🔄 In Arbeit',
      completed: '✅ Erledigt',
      skipped: '⏭️ Übersprungen',
      postponed: '📅 Verschoben'
    };
    const priorityText = priorityMap[task.priority] || task.priority;
    const energyText = energyMap[task.energy_required] || task.energy_required;
    const statusText = statusMap[task.status] || task.status;

    await ctx.editMessageText(
      `📝 *Task Details*\n\n` +
      `*${task.title}*\n\n` +
      `📊 Status: ${statusText}\n` +
      `🎯 Priorität: ${priorityText}\n` +
      `⚡ Energie: ${energyText}\n` +
      (task.scheduled_time ? `⏰ Zeit: ${task.scheduled_time.slice(0, 5)}\n` : '') +
      (task.times_postponed > 0 ? `⚠️ ${task.times_postponed}x verschoben\n` : '') +
      `\n_Was möchtest du tun?_`,
      {
        parse_mode: 'Markdown',
        reply_markup: getTaskActionKeyboard(taskId),
      }
    );
  } catch (error) {
    logger.error('Error selecting task:', error);
    await ctx.answerCallbackQuery('Fehler beim Laden');
  }
}

export async function completeTask(ctx: BotContext, taskId: string) {
  try {
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('title, user_id')
      .eq('id', taskId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) throw error;

    // Update daily log
    const today = formatDate(new Date());
    try {
      await supabase.rpc('increment_tasks_completed', { 
        p_user_id: task.user_id, 
        p_date: today 
      });
    } catch {
      // If RPC doesn't exist, ignore
    }

    await ctx.answerCallbackQuery('✅ Task erledigt! 🎉');
    
    // Show celebration message
    await ctx.editMessageText(
      `🎉 *Task erledigt!*\n\n` +
      `✅ ~${task.title}~\n\n` +
      `Großartige Arbeit! Weiter so! 💪`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📋 Alle Tasks', 'menu_tasks')
          .text('🏠 Menü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error completing task:', error);
    await ctx.answerCallbackQuery('Fehler beim Aktualisieren');
  }
}

export async function skipTask(ctx: BotContext, taskId: string) {
  ctx.session.step = 'task_skip_reason';
  ctx.session.taskData = { taskId };

  await ctx.editMessageText(
    `⏭️ *Task überspringen*\n\n` +
    `Warum möchtest du diesen Task überspringen?`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('⏰ Keine Zeit', `task_skip_confirm_${taskId}_no_time`)
        .row()
        .text('😴 Keine Energie', `task_skip_confirm_${taskId}_no_energy`)
        .row()
        .text('🚫 Nicht mehr relevant', `task_skip_confirm_${taskId}_not_relevant`)
        .row()
        .text('📅 Auf morgen verschieben', `task_postpone_${taskId}`)
        .row()
        .text('🔙 Zurück', `task_select_${taskId}`),
    }
  );
}

export async function confirmSkipTask(ctx: BotContext, taskId: string, reason: string) {
  try {
    const reasonMap: Record<string, string> = {
      'no_time': 'Keine Zeit',
      'no_energy': 'Keine Energie',
      'not_relevant': 'Nicht mehr relevant',
    };

    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: 'skipped',
        skip_reason: reasonMap[reason] || reason,
      })
      .eq('id', taskId);

    if (error) throw error;

    ctx.session.step = undefined;
    ctx.session.taskData = undefined;

    await ctx.answerCallbackQuery('Task übersprungen');
    
    const telegramId = ctx.from?.id;
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      await showTasksList(ctx, user.id, true);
    }
  } catch (error) {
    logger.error('Error skipping task:', error);
    await ctx.answerCallbackQuery('Fehler');
  }
}

export async function postponeTask(ctx: BotContext, taskId: string) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('times_postponed')
      .eq('id', taskId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: 'pending',
        scheduled_date: formatDate(tomorrow),
        times_postponed: (task.times_postponed || 0) + 1,
      })
      .eq('id', taskId);

    if (error) throw error;

    const warningMsg = task.times_postponed >= 2 
      ? `\n\n⚠️ _Dieser Task wurde bereits ${task.times_postponed + 1}x verschoben. Gibt es ein Hindernis?_`
      : '';

    await ctx.answerCallbackQuery('📅 Auf morgen verschoben');
    
    await ctx.editMessageText(
      `📅 *Task verschoben*\n\n` +
      `Der Task wurde auf morgen verschoben.${warningMsg}`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📋 Alle Tasks', 'menu_tasks')
          .text('🏠 Menü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error postponing task:', error);
    await ctx.answerCallbackQuery('Fehler');
  }
}

export async function deleteTask(ctx: BotContext, taskId: string) {
  await ctx.editMessageText(
    `🗑️ *Task löschen?*\n\n` +
    `Bist du sicher, dass du diesen Task löschen möchtest?\n\n` +
    `_Diese Aktion kann nicht rückgängig gemacht werden._`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('✅ Ja, löschen', `task_delete_confirm_${taskId}`)
        .text('❌ Abbrechen', `task_select_${taskId}`),
    }
  );
}

export async function confirmDeleteTask(ctx: BotContext, taskId: string) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    await ctx.answerCallbackQuery('🗑️ Task gelöscht');
    
    const telegramId = ctx.from?.id;
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      await showTasksList(ctx, user.id, true);
    }
  } catch (error) {
    logger.error('Error deleting task:', error);
    await ctx.answerCallbackQuery('Fehler beim Löschen');
  }
}
