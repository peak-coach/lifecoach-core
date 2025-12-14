// ============================================
// PEAK COACH - Message Handler
// ============================================

import { Bot } from 'grammy';
import { BotContext } from '../bot';
import { logger } from '../utils/logger';
import { handleTaskTitle, handleTaskTime } from '../commands/tasks';
import { handleHabitName } from '../commands/habits';
import { handleGoalTitle, handleGoalTarget, handleGoalProgressUpdate, handleGoalWhy } from '../commands/goals';
import { chatWithCoach } from '../services/coach';
import { InlineKeyboard } from 'grammy';

export function setupMessageHandlers(bot: Bot<BotContext>) {
  
  // Handle all text messages
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    const step = ctx.session.step;

    logger.info(`Message received: "${text}" (step: ${step})`);

    // Handle based on current step
    switch (step) {
      // ============================================
      // QUICK-TASK (Fast Path)
      // ============================================
      
      case 'quick_task_title':
        await handleQuickTaskButton(ctx, text);
        return;

      // ============================================
      // TASK CREATION FLOW
      // ============================================
      
      case 'task_create_title':
        await handleTaskTitle(ctx, text);
        return;

      case 'task_create_time':
        // Check if it's a valid time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):?([0-5][0-9])$/;
        const match = text.match(timeRegex);
        
        if (match) {
          const hours = match[1].padStart(2, '0');
          const minutes = match[2];
          await handleTaskTime(ctx, `${hours}:${minutes}:00`);
        } else {
          await ctx.reply(
            '⚠️ Bitte gib eine gültige Uhrzeit ein (z.B. "09:00" oder "14:30")',
            {
              reply_markup: new InlineKeyboard()
                .text('⏰ Ohne Zeit', 'task_time_none')
                .text('❌ Abbrechen', 'menu_tasks'),
            }
          );
        }
        return;

      // ============================================
      // HABIT CREATION FLOW
      // ============================================
      
      case 'habit_create_name':
        await handleHabitName(ctx, text);
        return;

      // ============================================
      // RECURRING TASK CREATION FLOW
      // ============================================
      
      case 'recurring_task_title':
        if (!ctx.session.recurringTaskData) ctx.session.recurringTaskData = {};
        ctx.session.recurringTaskData.title = text;
        ctx.session.step = 'recurring_task_frequency';
        
        await ctx.reply(
          `✅ Titel: *${text}*\n\n` +
          `Wie oft soll dieser Task erstellt werden?`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('📅 Täglich', 'recurring_freq_daily')
              .row()
              .text('📆 Wochentags (Mo-Fr)', 'recurring_freq_weekdays')
              .row()
              .text('🗓️ Wöchentlich', 'recurring_freq_weekly')
              .row()
              .text('❌ Abbrechen', 'menu_tasks'),
          }
        );
        return;

      // ============================================
      // GOAL CREATION FLOW
      // ============================================
      
      case 'goal_create_title':
        await handleGoalTitle(ctx, text);
        return;

      case 'goal_create_target':
        const targetValue = parseInt(text);
        if (isNaN(targetValue)) {
          await ctx.reply(
            '⚠️ Bitte gib eine Zahl ein (z.B. "10")',
            {
              reply_markup: new InlineKeyboard()
                .text('📊 Nicht messbar', 'goal_target_none')
                .text('❌ Abbrechen', 'menu_goals'),
            }
          );
        } else {
          await handleGoalTarget(ctx, targetValue);
        }
        return;

      case 'goal_update_progress':
        const progressValue = parseInt(text);
        if (isNaN(progressValue)) {
          await ctx.reply('⚠️ Bitte gib eine Zahl ein.');
        } else {
          await handleGoalProgressUpdate(ctx, progressValue);
        }
        return;

      case 'goal_create_why':
        await handleGoalWhyMessage(ctx, text);
        return;

      // ============================================
      // COACH CHAT
      // ============================================
      
      case 'coach_chat':
        await handleCoachChat(ctx, text);
        return;

      case 'add_knowledge':
        await handleAddKnowledge(ctx, text);
        return;

      // ============================================
      // DEFAULT: Quick Actions & Coach Chat
      // ============================================
      
      default:
        // Quick-Add Task: "Task: xyz" or "task: xyz"
        if (text.toLowerCase().startsWith('task:') || text.toLowerCase().startsWith('aufgabe:')) {
          await handleQuickAddTask(ctx, text);
          return;
        }
        
        // Quick-Add Goal: "Ziel: xyz"
        if (text.toLowerCase().startsWith('ziel:') || text.toLowerCase().startsWith('goal:')) {
          await handleQuickAddGoal(ctx, text);
          return;
        }
        
        // Help
        if (text.toLowerCase().includes('hilfe') || text.toLowerCase().includes('help')) {
          await ctx.reply(
            `💡 *Hilfe*\n\n` +
            `Nutze das Menü unten oder diese Befehle:\n\n` +
            `/start - Hauptmenü\n` +
            `/checkin - Check-in starten\n` +
            `/tasks - Tasks verwalten\n` +
            `/habits - Habits verwalten\n` +
            `/goals - Ziele verwalten\n` +
            `/stats - Statistiken\n\n` +
            `*Quick-Add:*\n` +
            `• "Task: Businessplan fertig" → Erstellt Task\n` +
            `• "Ziel: 10kg abnehmen" → Erstellt Ziel\n\n` +
            `Oder schreib mir einfach eine Nachricht!`,
            { parse_mode: 'Markdown' }
          );
        } else {
          // Default: Chat with coach
          await handleCoachChat(ctx, text);
        }
        return;
    }
  });
}

// ============================================
// QUICK-ADD FUNCTIONS
// ============================================

async function handleQuickAddTask(ctx: BotContext, text: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const { supabase } = await import('../services/supabase');
    const { formatDate } = await import('../utils/helpers');
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.reply('❌ Du bist noch nicht registriert. Nutze /start');
      return;
    }

    // Extract task title (remove "Task:" or "Aufgabe:" prefix)
    const title = text.replace(/^(task:|aufgabe:)\s*/i, '').trim();
    
    if (!title) {
      await ctx.reply('⚠️ Bitte gib einen Task-Titel an.\n\nBeispiel: "Task: Businessplan fertig"');
      return;
    }

    const today = formatDate(new Date());

    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: title,
        priority: 'medium',
        scheduled_date: today,
        status: 'pending',
        source: 'quick_add',
      });

    if (error) throw error;

    await ctx.reply(
      `✅ *Task erstellt!*\n\n` +
      `📋 ${title}\n` +
      `📅 Heute\n` +
      `🟡 Priorität: Mittel`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📋 Alle Tasks', 'menu_tasks')
          .text('🏠 Menü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error quick-adding task:', error);
    await ctx.reply('❌ Fehler beim Erstellen des Tasks.');
  }
}

async function handleQuickAddGoal(ctx: BotContext, text: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const { supabase } = await import('../services/supabase');
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.reply('❌ Du bist noch nicht registriert. Nutze /start');
      return;
    }

    // Extract goal title
    const title = text.replace(/^(ziel:|goal:)\s*/i, '').trim();
    
    if (!title) {
      await ctx.reply('⚠️ Bitte gib ein Ziel an.\n\nBeispiel: "Ziel: 10kg abnehmen"');
      return;
    }

    // Default to week timeframe for quick-add
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (7 - deadline.getDay())); // End of week

    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: title,
        timeframe: 'week',
        category: 'other',
        deadline: deadline.toISOString().split('T')[0],
        status: 'active',
      });

    if (error) throw error;

    await ctx.reply(
      `✅ *Wochenziel erstellt!*\n\n` +
      `🎯 ${title}\n` +
      `📅 Diese Woche\n\n` +
      `_Der Coach wird Tasks basierend auf diesem Ziel vorschlagen!_`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🎯 Alle Ziele', 'menu_goals')
          .text('🏠 Menü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error quick-adding goal:', error);
    await ctx.reply('❌ Fehler beim Erstellen des Ziels.');
  }
}

async function handleGoalWhyMessage(ctx: BotContext, why: string) {
  await handleGoalWhy(ctx, why.trim());
}

async function handleAddKnowledge(ctx: BotContext, content: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !content.trim()) return;

  try {
    const { supabase } = await import('../services/supabase');
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.reply('❌ Nutze /start um zu beginnen.');
      return;
    }

    const { addKnowledge } = await import('../services/rag');
    
    // Determine content type based on keywords
    let contentType: 'note' | 'insight' | 'preference' | 'goal_learning' | 'habit_learning' | 'reflection' = 'note';
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('ich arbeite') || lowerContent.includes('am besten wenn') || lowerContent.includes('ich mag')) {
      contentType = 'preference';
    } else if (lowerContent.includes('ich habe gelernt') || lowerContent.includes('ich habe gemerkt')) {
      contentType = 'insight';
    } else if (lowerContent.includes('mein ziel') || lowerContent.includes('warum')) {
      contentType = 'goal_learning';
    }

    const id = await addKnowledge(user.id, {
      content: content.trim(),
      contentType,
      source: 'user',
    });

    ctx.session.step = undefined;

    if (id) {
      await ctx.reply(
        `✅ *Gespeichert!*\n\n` +
        `📝 "${content.trim().slice(0, 100)}${content.length > 100 ? '...' : ''}"\n\n` +
        `_Der Coach wird sich das merken._`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('➕ Noch etwas', 'add_knowledge')
            .text('📚 Alle anzeigen', 'show_knowledge')
            .row()
            .text('🏠 Menü', 'show_main_menu'),
        }
      );
    } else {
      await ctx.reply('❌ Fehler beim Speichern. Versuche es erneut.');
    }
  } catch (error) {
    logger.error('Error adding knowledge:', error);
    await ctx.reply('❌ Fehler beim Speichern.');
  }
}

async function handleQuickTaskButton(ctx: BotContext, title: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !title.trim()) return;

  try {
    const { supabase } = await import('../services/supabase');
    const { formatDate } = await import('../utils/helpers');
    
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
        title: title.trim(),
        priority: 'medium',
        energy_required: 'medium',
        scheduled_date: today,
        status: 'pending',
        source: 'quick_button',
      })
      .select()
      .single();

    if (error) throw error;

    // Clear session
    ctx.session.step = undefined;

    await ctx.reply(
      `⚡ *Quick-Task erstellt!*\n\n` +
      `📝 ${title.trim()}\n` +
      `📅 Heute • 🟡 Mittel`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('✅ Erledigt', `task_complete_${task.id}`)
          .text('⚡ Noch eine', 'quick_task_start')
          .row()
          .text('📋 Alle Tasks', 'menu_tasks')
          .text('🏠 Menü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error in quick task button:', error);
    await ctx.reply('❌ Fehler beim Erstellen.');
  }
}

async function handleCoachChat(ctx: BotContext, message: string) {
  const telegramId = ctx.from?.id;
  
  if (!telegramId) {
    await ctx.reply('❌ Ein Fehler ist aufgetreten.');
    return;
  }

  try {
    // Show typing indicator
    await ctx.replyWithChatAction('typing');
    
    const { supabase } = await import('../services/supabase');
    
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

    const response = await chatWithCoach(user.id, message);

    await ctx.reply(
      `💬 *Coach:*\n\n${response}`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('💪 Danke!', 'show_main_menu')
          .text('💬 Weiter reden', 'menu_coach'),
      }
    );
  } catch (error) {
    logger.error('Error in coach chat:', error);
    await ctx.reply('❌ Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
  }
}

