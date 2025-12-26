// ============================================
// PEAK COACH - Callback Handler (German + Buttons)
// ============================================

import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../bot';
import { supabase } from '../services/supabase';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';
import { generateCoachMessage, chatWithCoach } from '../services/coach';
import { getMainMenuKeyboard, getMoreMenuKeyboard, MenuCounts } from '../commands/start';
import { 
  getSleepQualityKeyboard, 
  getSleepHoursKeyboard, 
  getEnergyKeyboard, 
  getMoodKeyboard,
  startMorningCheckin,
  startEveningCheckin 
} from '../commands/checkin';
import {
  showTasksList,
  startTaskCreation,
  handleTaskTitle,
  handleTaskPriority,
  handleTaskEnergy,
  handleTaskTime,
  selectTask,
  completeTask,
  skipTask,
  confirmSkipTask,
  postponeTask,
  deleteTask,
  confirmDeleteTask,
} from '../commands/tasks';
import {
  showHabitsList,
  startHabitCreation,
  handleHabitFrequency,
  handleHabitCategory,
  completeHabit,
} from '../commands/habits';
import { showWeeklyStats } from '../commands/stats';
import { 
  generateDailyTasks, 
  saveGeneratedTasks,
  createRecurringTasks,
} from '../services/taskGenerator';
import {
  showGoalsList,
  startGoalCreation,
  handleGoalCategory,
  handleGoalTimeframe,
  handleGoalTarget,
  selectGoal,
  updateGoalProgress,
  completeGoal,
  deleteGoal,
  confirmDeleteGoal,
  startWeeklyPlanning,
  addWeekGoal,
  getGoalCategoryKeyboard,
} from '../commands/goals';
import {
  dayCommand,
  handleDayTypeCallback,
  handleFeierabendCallback,
  handleStartWorkDay,
} from '../commands/workday';

export function setupCallbacks(bot: Bot<BotContext>) {
  
  // ============================================
  // MAIN MENU NAVIGATION
  // ============================================
  
  bot.callbackQuery('show_main_menu', async (ctx) => {
    await ctx.answerCallbackQuery();
    const firstName = ctx.from?.first_name || 'Champion';
    const telegramId = ctx.from?.id;
    
    // Get current work mode and counts
    let workMode: 'focus' | 'working' | 'off_work' | 'not_started' = 'not_started';
    let menuCounts: MenuCounts = {};
    
    if (telegramId) {
      try {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', telegramId)
          .single();
        
        if (user) {
          const today = formatDate(new Date());
          
          // Get work status
          const { data: status } = await supabase
            .from('work_status')
            .select('work_mode')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();
          
          if (status?.work_mode) {
            workMode = status.work_mode as typeof workMode;
          }

          // Get task counts
          const { data: tasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('user_id', user.id)
            .eq('scheduled_date', today);
          
          const totalTasks = tasks?.length || 0;
          const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;

          // Get habit counts
          const { data: habits } = await supabase
            .from('habits')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true);
          
          const { data: habitLogs } = await supabase
            .from('habit_logs')
            .select('habit_id')
            .eq('date', today)
            .eq('completed', true);

          menuCounts = {
            openTasks: totalTasks - completedTasks,
            totalTasks,
            completedHabits: habitLogs?.length || 0,
            totalHabits: habits?.length || 0,
          };
        }
      } catch (e) {
        // Use defaults
      }
    }
    
    await ctx.editMessageText(
      `🏆 *Peak Coach*\n\n` +
      `Hey ${firstName}! 👋`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainMenuKeyboard(workMode, menuCounts),
      }
    );
  });

  // ============================================
  // 📁 "MEHR" UNTERMENÜ
  // ============================================
  bot.callbackQuery('menu_more', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    await ctx.editMessageText(
      `📁 *Weitere Optionen*\n\n` +
      `Wähle eine Option:`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMoreMenuKeyboard(),
      }
    );
  });

  // Menu: Check-in
  bot.callbackQuery('menu_checkin', async (ctx) => {
    await ctx.answerCallbackQuery();
    const hour = new Date().getHours();
    
    await ctx.editMessageText(
      `📝 *Check-in*\n\n` +
      `Wähle deinen Check-in:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🌅 Morning Check-in', 'start_morning_checkin')
          .row()
          .text('🌙 Abend-Reflexion', 'start_evening_checkin')
          .row()
          .text('🔙 Zurück zum Menü', 'show_main_menu'),
      }
    );
  });

  // Menu: Tasks (NEW SYSTEM)
  bot.callbackQuery('menu_tasks', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
      
    if (user) {
      await showTasksList(ctx, user.id, true);
    }
  });

  // Task: Refresh
  bot.callbackQuery('refresh_tasks', async (ctx) => {
    await ctx.answerCallbackQuery('Aktualisiert!');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
      
    if (user) {
      await showTasksList(ctx, user.id, true);
    }
  });

  // Quick-Task Start (fast path)
  bot.callbackQuery('quick_task_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'quick_task_title';
    
    await ctx.editMessageText(
      `⚡ *Quick-Task*\n\n` +
      `Schreib mir einfach was du erledigen willst:\n\n` +
      `_Wird für heute erstellt mit mittlerer Priorität_`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('❌ Abbrechen', 'show_main_menu'),
      }
    );
  });

  // Task: Create Start (full flow)
  bot.callbackQuery('task_create_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startTaskCreation(ctx);
  });
  
  // Also handle old 'add_task' callback
  bot.callbackQuery('add_task', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startTaskCreation(ctx);
  });

  // Task: Priority Selection
  bot.callbackQuery(/^task_priority_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const priority = ctx.match[1];
    await handleTaskPriority(ctx, priority);
  });

  // Task: Energy Selection
  bot.callbackQuery(/^task_energy_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const energy = ctx.match[1];
    await handleTaskEnergy(ctx, energy);
  });

  // Task: Time None
  bot.callbackQuery('task_time_none', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleTaskTime(ctx, null);
  });

  // Task: Select
  bot.callbackQuery(/^task_select_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const taskId = ctx.match[1];
    await selectTask(ctx, taskId);
  });

  // Task: Complete
  bot.callbackQuery(/^task_complete_(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await completeTask(ctx, taskId);
  });

  // Task: Skip
  bot.callbackQuery(/^task_skip_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const taskId = ctx.match[1];
    await skipTask(ctx, taskId);
  });

  // Task: Skip Confirm
  bot.callbackQuery(/^task_skip_confirm_(.+)_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const taskId = ctx.match[1];
    const reason = ctx.match[2];
    await confirmSkipTask(ctx, taskId, reason);
  });

  // Task: Postpone
  bot.callbackQuery(/^task_postpone_(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await postponeTask(ctx, taskId);
  });

  // Task: Delete
  bot.callbackQuery(/^task_delete_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const taskId = ctx.match[1];
    if (ctx.callbackQuery.data?.includes('confirm')) {
      await confirmDeleteTask(ctx, taskId);
    } else {
      await deleteTask(ctx, taskId);
    }
  });

  // Task: Delete Confirm
  bot.callbackQuery(/^task_delete_confirm_(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await confirmDeleteTask(ctx, taskId);
  });

  // ============================================
  // RECURRING TASKS
  // ============================================

  bot.callbackQuery('create_recurring_task', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'recurring_task_title';
    ctx.session.recurringTaskData = {};
    
    await ctx.editMessageText(
      `🔁 *Wiederkehrenden Task erstellen*\n\n` +
      `Dieser Task wird automatisch jeden Tag/Woche erstellt.\n\n` +
      `Schreibe mir den *Titel*:\n\n` +
      `_Beispiel: "Morning Meditation" oder "Weekly Review"_`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('❌ Abbrechen', 'menu_tasks'),
      }
    );
  });

  bot.callbackQuery(/^recurring_freq_(.+)$/, async (ctx) => {
    const frequency = ctx.match[1];
    const telegramId = ctx.from?.id;
    
    if (!telegramId || !ctx.session.recurringTaskData) {
      await ctx.answerCallbackQuery('Fehler');
      return;
    }
    
    ctx.session.recurringTaskData.frequency = frequency;
    
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
        
      if (!user) return;
      
      const data = ctx.session.recurringTaskData;
      
      // Save recurring task
      const { error } = await supabase
        .from('recurring_tasks')
        .insert({
          user_id: user.id,
          title: data.title,
          frequency: frequency,
          priority: 'medium',
          is_active: true,
        });
        
      if (error) throw error;
      
      const freqText: Record<string, string> = {
        daily: 'jeden Tag',
        weekdays: 'an Wochentagen',
        weekly: 'jede Woche',
      };
      
      await ctx.answerCallbackQuery('✅ Erstellt!');
      await ctx.editMessageText(
        `✅ *Wiederkehrender Task erstellt!*\n\n` +
        `📝 ${data.title}\n` +
        `🔁 Wird ${freqText[frequency] || frequency} automatisch erstellt.\n\n` +
        `_Der Task erscheint automatisch bei deinem nächsten Morning Check-in!_`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('🔁 Noch einen erstellen', 'create_recurring_task')
            .row()
            .text('📋 Alle Tasks', 'menu_tasks')
            .text('🏠 Menü', 'show_main_menu'),
        }
      );
      
      ctx.session.recurringTaskData = undefined;
      ctx.session.step = undefined;
    } catch (error) {
      logger.error('Error creating recurring task:', error);
      await ctx.answerCallbackQuery('Fehler beim Speichern');
    }
  });

  // Show recurring tasks list
  bot.callbackQuery('show_recurring_tasks', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    
    if (!telegramId) return;
    
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
        
      if (!user) return;
      
      const { data: recurring } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (!recurring || recurring.length === 0) {
        await ctx.editMessageText(
          `🔁 *Wiederkehrende Tasks*\n\n` +
          `_Noch keine wiederkehrenden Tasks._\n\n` +
          `Diese werden automatisch jeden Tag/Woche erstellt!`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('➕ Erstellen', 'create_recurring_task')
              .row()
              .text('🔙 Zurück', 'menu_tasks'),
          }
        );
        return;
      }
      
      const freqEmoji: Record<string, string> = {
        daily: '📅',
        weekdays: '📆',
        weekly: '🗓️',
      };
      
      const list = recurring.map(r => 
        `${freqEmoji[r.frequency] || '🔁'} ${r.title}`
      ).join('\n');
      
      await ctx.editMessageText(
        `🔁 *Wiederkehrende Tasks*\n\n` +
        `${list}\n\n` +
        `_Diese Tasks werden automatisch erstellt._`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('➕ Neu erstellen', 'create_recurring_task')
            .row()
            .text('🔙 Zurück', 'menu_tasks'),
        }
      );
    } catch (error) {
      logger.error('Error showing recurring tasks:', error);
    }
  });

  // Menu: Habits (NEW SYSTEM)
  bot.callbackQuery('menu_habits', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
      
    if (user) {
      await showHabitsList(ctx, user.id, true);
    }
  });

  // Habit: Create Start
  bot.callbackQuery('habit_create_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startHabitCreation(ctx);
  });
  
  // Also handle old 'create_habit' callback
  bot.callbackQuery('create_habit', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startHabitCreation(ctx);
  });

  // Habit: Frequency Selection
  bot.callbackQuery(/^habit_freq_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const frequency = ctx.match[1];
    await handleHabitFrequency(ctx, frequency);
  });

  // Habit: Category Selection
  bot.callbackQuery(/^habit_cat_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const category = ctx.match[1];
    await handleHabitCategory(ctx, category);
  });

  // Habit: Complete (NEW)
  bot.callbackQuery(/^habit_complete_(.+)$/, async (ctx) => {
    const habitId = ctx.match[1];
    await completeHabit(ctx, habitId);
  });

  // Menu: Goals (FULL IMPLEMENTATION)
  bot.callbackQuery('menu_goals', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
      
    if (user) {
      await showGoalsList(ctx, user.id, true);
    }
  });

  // Goals: Refresh
  bot.callbackQuery('refresh_goals', async (ctx) => {
    await ctx.answerCallbackQuery('Aktualisiert!');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
      
    if (user) {
      await showGoalsList(ctx, user.id, true);
    }
  });

  // Goals: Create Start
  bot.callbackQuery('goal_create_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startGoalCreation(ctx);
  });
  
  // Also handle old 'create_goal' callback
  bot.callbackQuery('create_goal', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startGoalCreation(ctx);
  });

  // Goals: Category Selection
  bot.callbackQuery(/^goal_cat_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const category = ctx.match[1];
    await handleGoalCategory(ctx, category);
  });

  // Goals: Timeframe Selection
  bot.callbackQuery(/^goal_time_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const timeframe = ctx.match[1];
    await handleGoalTimeframe(ctx, timeframe);
  });

  // Goals: Target None
  bot.callbackQuery('goal_target_none', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleGoalTarget(ctx, null);
  });

  // Goals: Why Skip
  bot.callbackQuery('goal_why_skip', async (ctx) => {
    await ctx.answerCallbackQuery();
    const { handleGoalWhy } = await import('../commands/goals');
    await handleGoalWhy(ctx, null);
  });

  // ============================================
  // GOAL REFINEMENT CALLBACKS
  // ============================================

  // Accept refined goal with AI-suggested milestones
  bot.callbackQuery('goal_accept_refined', async (ctx) => {
    await ctx.answerCallbackQuery('Erstelle optimiertes Ziel...');
    const telegramId = ctx.from?.id;
    
    if (!telegramId || !ctx.session.goalData) {
      await ctx.editMessageText('❌ Fehler: Keine Zieldaten gefunden.');
      return;
    }

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (!user) {
        await ctx.editMessageText('❌ User nicht gefunden.');
        return;
      }

      const goalData = ctx.session.goalData;
      
      // Calculate deadline
      let deadline = goalData.deadline;
      if (!deadline) {
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 84); // ~12 weeks
        deadline = deadlineDate.toISOString().split('T')[0];
      }

      // Map category to DB-allowed values
      const categoryMap: Record<string, string> = {
        'career': 'career', 'health': 'health', 'fitness': 'health',
        'learning': 'learning', 'finance': 'finance', 'relationships': 'relationships',
        'personal': 'personal', 'mental': 'personal', 'other': 'personal',
        'rhetorik': 'learning', 'fuehrerschein': 'learning', 'business': 'career',
        'ki': 'learning', 'trt': 'health', 'muskelaufbau': 'health',
      };
      const dbCategory = categoryMap[goalData.category?.toLowerCase() || ''] || 'personal';

      // Create goal
      const { data: newGoal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goalData.title,
          description: goalData.originalTitle !== goalData.title ? `Ursprünglich: "${goalData.originalTitle}"` : null,
          category: dbCategory,
          target_value: goalData.targetValue || 100,
          current_value: 0,
          deadline: deadline,
          why_important: goalData.whyImportant,
          status: 'active',
        })
        .select()
        .single();

      if (goalError || !newGoal) {
        logger.error('Error creating refined goal:', goalError);
        await ctx.editMessageText('❌ Fehler beim Erstellen des Ziels.');
        return;
      }

      // Create milestones from suggestions
      const milestones = goalData.suggestedMilestones || [];
      for (let i = 0; i < milestones.length; i++) {
        await supabase
          .from('milestones')
          .insert({
            goal_id: newGoal.id,
            user_id: user.id,
            title: milestones[i],
            position: i,
            completed: false,
          });
      }

      // Format expert insights
      const insights = goalData.expertInsights || [];
      let insightsText = '';
      if (insights.length > 0) {
        insightsText = `\n\n🧠 *Merke dir:*\n${insights.slice(0, 2).join('\n')}`;
      }

      ctx.session.goalData = undefined;
      ctx.session.step = undefined;

      await ctx.editMessageText(
        `🎉 *Ziel erstellt!*\n\n` +
        `🎯 *${goalData.title}*\n\n` +
        `📊 ${milestones.length} Meilensteine hinzugefügt\n` +
        `📅 Deadline: ${new Date(deadline).toLocaleDateString('de-DE')}` +
        insightsText + `\n\n` +
        `_Dein erster Meilenstein:_\n` +
        `→ ${milestones[0] || 'Noch keiner definiert'}`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('✨ Tasks generieren', 'generate_daily_tasks')
            .row()
            .text('🎯 Ziele anzeigen', 'menu_goals')
            .text('🏠 Hauptmenü', 'show_main_menu'),
        }
      );

    } catch (error) {
      logger.error('Error in goal_accept_refined:', error);
      await ctx.editMessageText('❌ Ein Fehler ist aufgetreten.');
    }
  });

  // Modify refined goal
  bot.callbackQuery('goal_modify_refined', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'goal_create_category';
    
    const title = ctx.session.goalData?.title || 'Dein Ziel';
    
    await ctx.editMessageText(
      `✏️ *Ziel anpassen*\n\n` +
      `Aktuell: *${title}*\n\n` +
      `Wähle die *Kategorie*:`,
      {
        parse_mode: 'Markdown',
        reply_markup: getGoalCategoryKeyboard(),
      }
    );
  });

  // Use original goal title (skip refinement)
  bot.callbackQuery('goal_use_original', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    // Reset to original title
    if (ctx.session.goalData?.originalTitle) {
      ctx.session.goalData.title = ctx.session.goalData.originalTitle;
    }
    ctx.session.step = 'goal_create_category';
    
    const title = ctx.session.goalData?.title || 'Dein Ziel';
    
    await ctx.editMessageText(
      `✅ Ziel: *${title}*\n\n` +
      `In welche *Kategorie* gehört dieses Ziel?`,
      {
        parse_mode: 'Markdown',
        reply_markup: getGoalCategoryKeyboard(),
      }
    );
  });

  // Goals: Select
  bot.callbackQuery(/^goal_select_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const goalId = ctx.match[1];
    await selectGoal(ctx, goalId);
  });

  // Goals: Update Progress
  bot.callbackQuery(/^goal_update_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const goalId = ctx.match[1];
    await updateGoalProgress(ctx, goalId);
  });

  // Goals: Complete
  bot.callbackQuery(/^goal_complete_(.+)$/, async (ctx) => {
    const goalId = ctx.match[1];
    await completeGoal(ctx, goalId);
  });

  // Goals: Delete
  bot.callbackQuery(/^goal_delete_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const goalId = ctx.match[1];
    if (ctx.callbackQuery.data?.includes('confirm')) {
      await confirmDeleteGoal(ctx, goalId);
    } else {
      await deleteGoal(ctx, goalId);
    }
  });

  // Goals: Delete Confirm
  bot.callbackQuery(/^goal_delete_confirm_(.+)$/, async (ctx) => {
    const goalId = ctx.match[1];
    await confirmDeleteGoal(ctx, goalId);
  });

  // Weekly Planning
  bot.callbackQuery('start_weekly_planning', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startWeeklyPlanning(ctx);
  });

  // Add Week Goal
  bot.callbackQuery('add_week_goal', async (ctx) => {
    await ctx.answerCallbackQuery();
    await addWeekGoal(ctx);
  });

  // Archive Week Goals
  bot.callbackQuery('archive_week_goals', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
        
      if (!user) return;
      
      // Archive old week goals
      await supabase
        .from('goals')
        .update({ status: 'archived' })
        .eq('user_id', user.id)
        .eq('timeframe', 'week')
        .eq('status', 'active');
      
      await ctx.editMessageText(
        `✅ *Alte Wochenziele archiviert!*\n\n` +
        `Du kannst jetzt neue Ziele für diese Woche setzen.`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('➕ Neues Wochenziel', 'add_week_goal')
            .row()
            .text('🔙 Zurück', 'menu_goals'),
        }
      );
    } catch (error) {
      logger.error('Error archiving goals:', error);
    }
  });

  // Menu: Stats (NEW SYSTEM)
  bot.callbackQuery('menu_stats', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
      
    if (user) {
      await showWeeklyStats(ctx, user.id, true);
    }
  });

  // Stats: Refresh
  bot.callbackQuery('refresh_stats', async (ctx) => {
    await ctx.answerCallbackQuery('Aktualisiert!');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
      
    if (user) {
      await showWeeklyStats(ctx, user.id, true);
    }
  });

  // Menu: Coach
  bot.callbackQuery('menu_coach', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'coach_chat';
    
    await ctx.editMessageText(
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
          .text('🔙 Zurück zum Menü', 'show_main_menu'),
      }
    );
  });

  // Knowledge Base - Add Note
  bot.callbackQuery('add_knowledge', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'add_knowledge';

    await ctx.editMessageText(
      `📝 *Wissen speichern*\n\n` +
      `Schreib mir etwas das ich über dich merken soll:\n\n` +
      `_Beispiele:_\n` +
      `• "Ich arbeite am besten nach dem Sport"\n` +
      `• "Montags habe ich oft wenig Energie"\n` +
      `• "Mein Warum für Fitness: Für meine Kinder fit bleiben"`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('❌ Abbrechen', 'show_main_menu'),
      }
    );
  });

  // Knowledge Base - Show
  bot.callbackQuery('show_knowledge', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (!user) return;

      const { listUserKnowledge } = await import('../services/rag');
      const knowledge = await listUserKnowledge(user.id, 5);

      if (knowledge.length === 0) {
        await ctx.editMessageText(
          `📚 *Deine Wissensbasis*\n\n` +
          `_Noch leer. Speichere Infos über dich, damit der Coach dich besser versteht!_`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('➕ Wissen hinzufügen', 'add_knowledge')
              .row()
              .text('🏠 Menü', 'show_main_menu'),
          }
        );
        return;
      }

      let message = `📚 *Deine Wissensbasis*\n\n`;
      knowledge.forEach((k, i) => {
        const typeEmoji: Record<string, string> = {
          note: '📝',
          insight: '💡',
          preference: '⭐',
          goal_learning: '🎯',
          habit_learning: '🔄',
          reflection: '🪞',
        };
        message += `${typeEmoji[k.type] || '📝'} ${k.content.slice(0, 80)}${k.content.length > 80 ? '...' : ''}\n\n`;
      });

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('➕ Hinzufügen', 'add_knowledge')
          .row()
          .text('🏠 Menü', 'show_main_menu'),
      });
    } catch (error) {
      logger.error('Error showing knowledge:', error);
      await ctx.answerCallbackQuery('Fehler');
    }
  });

  // Menu: Settings
  bot.callbackQuery('menu_settings', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `⚙️ *Einstellungen*\n\n` +
      `Passe deinen Coach an:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🎭 Coach-Stil', 'settings_coach_style')
          .text('😴 Schlaf', 'settings_sleep')
          .row()
          .text('📚 Wissensbasis', 'show_knowledge')
          .text('🛡️ Grace Day', 'activate_grace_day')
          .row()
          .text('🔙 Zurück zum Menü', 'show_main_menu'),
      }
    );
  });

  // Settings: Coach Style
  bot.callbackQuery('settings_coach_style', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profile')
      .select('coach_style')
      .eq('user_id', user.id)
      .single();

    const currentStyle = profile?.coach_style || 'balanced';
    const styleEmoji = { tough: '💪', balanced: '⚖️', gentle: '🤗' };
    const styleName = { tough: 'Tough Love', balanced: 'Ausgewogen', gentle: 'Sanft' };

    await ctx.editMessageText(
      `🎭 *Coach-Stil*\n\n` +
      `Aktuell: ${styleEmoji[currentStyle as keyof typeof styleEmoji]} ${styleName[currentStyle as keyof typeof styleName]}\n\n` +
      `Wähle deinen bevorzugten Stil:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('💪 Tough Love', 'set_coach_style_tough')
          .row()
          .text('⚖️ Ausgewogen', 'set_coach_style_balanced')
          .row()
          .text('🤗 Sanft', 'set_coach_style_gentle')
          .row()
          .text('🔙 Zurück', 'menu_settings'),
      }
    );
  });

  // Set Coach Style
  bot.callbackQuery(/^set_coach_style_(.+)$/, async (ctx) => {
    const style = ctx.match[1];
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    await supabase
      .from('user_profile')
      .update({ coach_style: style })
      .eq('user_id', user.id);

    const styleName = { tough: 'Tough Love 💪', balanced: 'Ausgewogen ⚖️', gentle: 'Sanft 🤗' };
    
    await ctx.answerCallbackQuery(`Stil geändert: ${styleName[style as keyof typeof styleName]}`);
    await ctx.editMessageText(
      `✅ *Coach-Stil aktualisiert!*\n\n` +
      `Neuer Stil: ${styleName[style as keyof typeof styleName]}\n\n` +
      `Der Coach wird sich jetzt entsprechend verhalten.`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🔙 Einstellungen', 'menu_settings')
          .text('🏠 Menü', 'show_main_menu'),
      }
    );
  });

  // Stats: Last Week
  bot.callbackQuery('stats_last_week', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    
    if (user) {
      await showWeeklyStats(ctx, user.id, true);
    }
  });

  // Stats: Month
  bot.callbackQuery('stats_month', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    
    if (user) {
      // For now, show weekly stats (month stats would need additional implementation)
      await showWeeklyStats(ctx, user.id, true);
    }
  });

  // Tasks: Other Days
  bot.callbackQuery('tasks_other_days', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    // Get next 7 days tasks
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, scheduled_date, priority')
      .eq('user_id', user.id)
      .gt('scheduled_date', formatDate(today))
      .lte('scheduled_date', formatDate(nextWeek))
      .order('scheduled_date', { ascending: true })
      .limit(15);

    if (!tasks || tasks.length === 0) {
      await ctx.editMessageText(
        `📅 *Kommende Tasks*\n\n` +
        `Keine Tasks für die nächsten 7 Tage geplant.`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('➕ Task erstellen', 'task_create_start')
            .row()
            .text('🔙 Zurück', 'menu_tasks'),
        }
      );
      return;
    }

    // Group by date
    const grouped: Record<string, typeof tasks> = {};
    tasks.forEach(task => {
      const date = task.scheduled_date || 'Unbekannt';
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(task);
    });

    let message = `📅 *Kommende Tasks*\n\n`;
    Object.entries(grouped).forEach(([date, dateTasks]) => {
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
      message += `*${dayName}*\n`;
      dateTasks.forEach(task => {
        const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        message += `  ${priorityIcon} ${task.title}\n`;
      });
      message += `\n`;
    });

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('📋 Heute', 'menu_tasks')
        .text('➕ Neu', 'task_create_start')
        .row()
        .text('🏠 Menü', 'show_main_menu'),
    });
  });

  // Grace Day Activation
  bot.callbackQuery('activate_grace_day', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (!user) return;

      const { data: result } = await supabase.rpc('set_grace_day', { p_user_id: user.id });

      if (result?.success) {
        await ctx.editMessageText(
          `🛡️ *Grace Day aktiviert!*\n\n` +
          `Heute ist Scheitern okay. Der Coach wird sanfter sein.\n\n` +
          `Verbleibende Grace Days: ${result.grace_days_remaining}/Monat\n\n` +
          `_Nutze den Tag für Erholung oder reduzierte Ziele._`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('🏠 Hauptmenü', 'show_main_menu'),
          }
        );
      } else {
        await ctx.editMessageText(
          `⚠️ *Grace Day nicht möglich*\n\n` +
          `${result?.message || 'Limit erreicht.'}\n\n` +
          `_Grace Days werden monatlich zurückgesetzt._`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('🔙 Zurück', 'menu_settings'),
          }
        );
      }
    } catch (error) {
      logger.error('Error setting grace day:', error);
      await ctx.answerCallbackQuery('Fehler');
    }
  });

  // ============================================
  // POMODORO
  // ============================================

  bot.callbackQuery('menu_pomodoro', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      const { showPomodoroMenu } = await import('../commands/pomodoro');
      await showPomodoroMenu(ctx, user.id, true);
    }
  });

  // Pomodoro Start (without duration - show task selection)
  bot.callbackQuery('pomodoro_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    
    if (!user) return;
    
    // Get today's tasks
    const today = formatDate(new Date());
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, priority')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: true })
      .limit(5);
    
    const keyboard = new InlineKeyboard();
    
    if (tasks && tasks.length > 0) {
      tasks.forEach(task => {
        const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        keyboard.text(`${priorityIcon} ${task.title.substring(0, 25)}`, `pomodoro_task_${task.id}`).row();
      });
    }
    
    keyboard.text('🍅 Ohne Task (25 Min)', 'pomodoro_start_25').row();
    keyboard.text('🔙 Zurück', 'menu_pomodoro');
    
    await ctx.editMessageText(
      `🍅 *Pomodoro starten*\n\n` +
      `Wähle einen Task für diese Session:`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    );
  });

  // Pomodoro Break Short (5 min)
  bot.callbackQuery('pomodoro_break_short', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    
    if (!user) return;
    
    // Create break session
    await supabase
      .from('pomodoro_sessions')
      .insert({
        user_id: user.id,
        type: 'short_break',
        duration_minutes: 5,
        started_at: new Date().toISOString(),
        status: 'active',
      });
    
    await ctx.editMessageText(
      `☕ *Kurze Pause gestartet*\n\n` +
      `5 Minuten - entspann dich!\n\n` +
      `💡 Tipp: Steh auf, streck dich, trink Wasser.`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('⏹ Pause beenden', 'pomodoro_complete')
          .row()
          .text('🔙 Menü', 'menu_pomodoro'),
      }
    );
  });

  // Pomodoro Break Long (15 min)
  bot.callbackQuery('pomodoro_break_long', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    
    if (!user) return;
    
    // Create break session
    await supabase
      .from('pomodoro_sessions')
      .insert({
        user_id: user.id,
        type: 'long_break',
        duration_minutes: 15,
        started_at: new Date().toISOString(),
        status: 'active',
      });
    
    await ctx.editMessageText(
      `🧘 *Lange Pause gestartet*\n\n` +
      `15 Minuten - richtig erholen!\n\n` +
      `💡 Tipp: Geh kurz raus, mach einen Snack.`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('⏹ Pause beenden', 'pomodoro_complete')
          .row()
          .text('🔙 Menü', 'menu_pomodoro'),
      }
    );
  });

  bot.callbackQuery(/^pomodoro_start_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const duration = parseInt(ctx.match[1]);
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      const { startPomodoro } = await import('../commands/pomodoro');
      await startPomodoro(ctx, user.id, duration);
    }
  });

  bot.callbackQuery(/^pomodoro_task_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const taskId = ctx.match[1];
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      const { startPomodoro } = await import('../commands/pomodoro');
      await startPomodoro(ctx, user.id, 25, taskId);
    }
  });

  bot.callbackQuery('pomodoro_complete', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      const { completePomodoro } = await import('../commands/pomodoro');
      await completePomodoro(ctx, user.id);
    }
  });

  bot.callbackQuery('pomodoro_cancel', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      const { cancelPomodoro } = await import('../commands/pomodoro');
      await cancelPomodoro(ctx, user.id);
    }
  });

  bot.callbackQuery('pomodoro_refresh', async (ctx) => {
    await ctx.answerCallbackQuery('Aktualisiert');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      const { showPomodoroMenu } = await import('../commands/pomodoro');
      await showPomodoroMenu(ctx, user.id, true);
    }
  });

  bot.callbackQuery('pomodoro_stats', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      const { showPomodoroStats } = await import('../commands/pomodoro');
      await showPomodoroStats(ctx, user.id);
    }
  });

  bot.callbackQuery('pomodoro_select_task', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      const { showTasksForPomodoro } = await import('../commands/pomodoro');
      await showTasksForPomodoro(ctx, user.id);
    }
  });

  // Smart Insights
  bot.callbackQuery('show_smart_insights', async (ctx) => {
    await ctx.answerCallbackQuery('⏳ Analysiere...');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (!user) return;

      const { generateSmartSuggestions } = await import('../services/predictions');
      const suggestions = await generateSmartSuggestions(user.id);

      if (suggestions.length === 0) {
        await ctx.editMessageText(
          `🧠 *Smart Insights*\n\n` +
          `Alles gut! Keine besonderen Empfehlungen für heute.\n\n` +
          `_Nutze /patterns für eine tiefere Analyse._`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('🧠 Patterns', 'show_patterns')
              .text('🏠 Menü', 'show_main_menu'),
          }
        );
        return;
      }

      const typeEmoji: Record<string, string> = {
        task: '📋',
        habit: '🔄',
        optimization: '✨',
        warning: '⚠️',
      };

      const priorityEmoji: Record<string, string> = {
        high: '🔴',
        medium: '🟡',
        low: '🟢',
      };

      let message = `🧠 *Smart Insights für heute*\n\n`;

      suggestions.slice(0, 4).forEach(s => {
        message += `${typeEmoji[s.type]} ${priorityEmoji[s.priority]} *${s.title}*\n`;
        message += `${s.description}\n`;
        message += `_${s.reason}_\n\n`;
      });

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🧠 Alle Patterns', 'show_patterns')
          .row()
          .text('📋 Tasks', 'menu_tasks')
          .text('🏠 Menü', 'show_main_menu'),
      });
    } catch (error) {
      logger.error('Error showing insights:', error);
      await ctx.answerCallbackQuery('Fehler');
    }
  });

  // Show Patterns
  bot.callbackQuery('show_patterns', async (ctx) => {
    await ctx.answerCallbackQuery('⏳ Analysiere...');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (!user) return;

      const { analyzeUserPatterns } = await import('../services/patternAnalysis');
      const patterns = await analyzeUserPatterns(user.id);

      if (patterns.length === 0) {
        await ctx.editMessageText(
          `🧠 *Pattern Analyse*\n\n` +
          `Noch nicht genug Daten.\n_Mind. 2 Wochen Nutzung nötig._`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('🏠 Menü', 'show_main_menu'),
          }
        );
        return;
      }

      const patternEmoji: Record<string, string> = {
        sleep_performance: '😴',
        day_of_week: '📅',
        energy_task_match: '⚡',
        streak_behavior: '🔥',
        postponement: '📌',
        mood_productivity: '😊',
        workload: '📋',
      };

      let message = `🧠 *Deine Patterns*\n\n`;

      patterns.slice(0, 4).forEach(p => {
        const emoji = patternEmoji[p.type] || '📊';
        message += `${emoji} *${p.description}*\n`;
        message += `💡 _${p.recommendation}_\n\n`;
      });

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📊 Weekly Report', 'generate_weekly_report')
          .row()
          .text('🏠 Menü', 'show_main_menu'),
      });
    } catch (error) {
      logger.error('Error showing patterns:', error);
      await ctx.answerCallbackQuery('Fehler');
    }
  });

  // Generate Weekly Report
  bot.callbackQuery('generate_weekly_report', async (ctx) => {
    await ctx.answerCallbackQuery('⏳ Generiere Report...');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (!user) return;

      const { generateWeeklyReport } = await import('../services/weeklyReport');
      const report = await generateWeeklyReport(user.id);

      await ctx.editMessageText(
        `📊 *Dein Weekly Report*\n\n${report}`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('📋 Tasks', 'menu_tasks')
            .text('🎯 Ziele', 'menu_goals')
            .row()
            .text('🏠 Menü', 'show_main_menu'),
        }
      );
    } catch (error) {
      logger.error('Error generating report:', error);
      await ctx.answerCallbackQuery('Fehler');
    }
  });

  // Sleep Settings
  bot.callbackQuery('settings_sleep', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (!user) return;

      const { data: sleepData } = await supabase.rpc('get_sleep_recommendation', { p_user_id: user.id });

      if (sleepData) {
        await ctx.editMessageText(
          `😴 *Schlaf-Analyse*\n\n` +
          `🎯 Ziel: ${sleepData.sleep_goal}h (${sleepData.cycles} Zyklen)\n` +
          `📊 Ø letzte 7 Tage: ${sleepData.avg_sleep_7d}h\n` +
          `${sleepData.sleep_debt_hours > 0 ? `⚠️ Schlafschuld: ${sleepData.sleep_debt_hours}h\n` : ''}` +
          `\n🛏️ Empfohlen: ${sleepData.recommended_bedtime} ins Bett\n` +
          `⏰ Aufstehen: ${sleepData.recommended_wake}\n\n` +
          `💡 ${sleepData.recommendation}`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('🔙 Zurück', 'menu_settings')
              .text('🏠 Menü', 'show_main_menu'),
          }
        );
      }
    } catch (error) {
      logger.error('Error getting sleep data:', error);
      await ctx.answerCallbackQuery('Fehler beim Laden');
    }
  });

  // ============================================
  // CHECK-IN FLOW
  // ============================================

  // Start Check-in (alias for morning checkin - used by scheduler)
  bot.callbackQuery('start_checkin', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startMorningCheckin(ctx);
  });

  // Show Tasks (used by scheduler midday check)
  bot.callbackQuery('show_tasks', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    
    if (user) {
      await showTasksList(ctx, user.id);
    }
  });

  // Talk to Coach (used by scheduler)
  bot.callbackQuery('talk_to_coach', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = 'coach_chat';
    await ctx.editMessageText(
      `💬 *Coach Chat*\n\n` +
      `Was beschäftigt dich? Schreib mir einfach eine Nachricht.\n\n` +
      `Beispiele:\n` +
      `• "Ich bin unmotiviert"\n` +
      `• "Wie priorisiere ich heute?"\n` +
      `• "Ich schaffe meine Tasks nicht"`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🔙 Zurück', 'show_main_menu'),
      }
    );
  });

  bot.callbackQuery('start_morning_checkin', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startMorningCheckin(ctx);
  });

  bot.callbackQuery('start_evening_checkin', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startEveningCheckin(ctx);
  });

  // Morning: Sleep Quality
  bot.callbackQuery(/^morning_sleep_quality_(\d+)$/, async (ctx) => {
    const quality = parseInt(ctx.match[1]);
    if (ctx.session.checkinData) {
      ctx.session.checkinData.sleepQuality = quality;
    }
    ctx.session.step = 'checkin_sleep_hours';

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `🌅 *Morning Check-in*\n\n` +
      `✅ Schlafqualität: ${quality}/10\n\n` +
      `*Frage 2/4:* Wie viele Stunden hast du geschlafen?`,
      {
        parse_mode: 'Markdown',
        reply_markup: getSleepHoursKeyboard(),
      }
    );
  });

  // Morning: Sleep Hours
  bot.callbackQuery(/^morning_sleep_hours_([\d.]+)$/, async (ctx) => {
    const hours = parseFloat(ctx.match[1]);
    if (ctx.session.checkinData) {
      ctx.session.checkinData.sleepHours = hours;
    }
    ctx.session.step = 'checkin_energy';

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `🌅 *Morning Check-in*\n\n` +
      `✅ Schlaf: ${hours} Stunden\n\n` +
      `*Frage 3/4:* Wie ist deine Energie gerade?`,
      {
        parse_mode: 'Markdown',
        reply_markup: getEnergyKeyboard('morning'),
      }
    );
  });

  // Morning: Energy
  bot.callbackQuery(/^morning_energy_(\d+)$/, async (ctx) => {
    const energy = parseInt(ctx.match[1]);
    if (ctx.session.checkinData) {
      ctx.session.checkinData.energy = energy;
    }
    ctx.session.step = 'checkin_mood';

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `🌅 *Morning Check-in*\n\n` +
      `✅ Energie: ${energy}/10\n\n` +
      `*Frage 4/4:* Wie ist deine Stimmung?`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMoodKeyboard('morning'),
      }
    );
  });

  // Morning: Mood (Final step)
  bot.callbackQuery(/^morning_mood_(\d+)$/, async (ctx) => {
    const mood = parseInt(ctx.match[1]);
    await saveMorningCheckin(ctx, mood);
  });

  // Evening: Mood
  bot.callbackQuery(/^evening_mood_(\d+)$/, async (ctx) => {
    const mood = parseInt(ctx.match[1]);
    if (ctx.session.checkinData) {
      ctx.session.checkinData.mood = mood;
    }
    ctx.session.step = 'checkin_evening_energy';

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `🌙 *Abend-Reflexion*\n\n` +
      `✅ Stimmung: ${mood}/10\n\n` +
      `Wie ist deine Energie jetzt?`,
      {
        parse_mode: 'Markdown',
        reply_markup: getEnergyKeyboard('evening'),
      }
    );
  });

  // Evening: Energy (Final step)
  bot.callbackQuery(/^evening_energy_(\d+)$/, async (ctx) => {
    const energy = parseInt(ctx.match[1]);
    await saveEveningCheckin(ctx, energy);
  });

  // ============================================
  // ONBOARDING
  // ============================================

  bot.callbackQuery('onboarding_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `🎯 *Lass uns starten!*\n\n` +
      `Ich möchte dich kennenlernen.\n\n` +
      `*Frage 1:* Bist du eher Frühaufsteher oder Nachteule?`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🐦 Frühaufsteher', 'onboard_chrono_early')
          .row()
          .text('🦉 Nachteule', 'onboard_chrono_night')
          .row()
          .text('😐 Irgendwo dazwischen', 'onboard_chrono_neutral'),
      }
    );
  });

  bot.callbackQuery(/^onboard_chrono_(.+)$/, async (ctx) => {
    const chronotype = ctx.match[1];
    const telegramId = ctx.from?.id;

    // Save chronotype
    if (telegramId) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (user) {
        const chronoMap: Record<string, string> = {
          'early': 'early_bird',
          'night': 'night_owl',
          'neutral': 'neutral'
        };
        
        await supabase
          .from('user_profile')
          .update({ chronotype: chronoMap[chronotype] || 'neutral' })
          .eq('user_id', user.id);
      }
    }

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `🎯 *Fast fertig!*\n\n` +
      `Wie soll ich dich coachen?\n\n` +
      `*Frage 2:* Wähle deinen Coach-Stil:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('💪 Streng & Fordernd', 'onboard_style_tough')
          .row()
          .text('🤗 Sanft & Unterstützend', 'onboard_style_gentle')
          .row()
          .text('⚖️ Ausgewogen', 'onboard_style_balanced'),
      }
    );
  });

  bot.callbackQuery(/^onboard_style_(.+)$/, async (ctx) => {
    const style = ctx.match[1];
    const telegramId = ctx.from?.id;

    // Save coach style
    if (telegramId) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (user) {
        await supabase
          .from('user_profile')
          .update({ coach_style: style })
          .eq('user_id', user.id);
      }
    }

    await ctx.answerCallbackQuery('✅ Einstellungen gespeichert!');
    
    const firstName = ctx.from?.first_name || 'Champion';
    await ctx.editMessageText(
      `🎉 *Perfekt, ${firstName}!*\n\n` +
      `Dein Coach ist eingerichtet und bereit.\n\n` +
      `💡 *Tipp:* Starte jeden Tag mit einem Morning Check-in!\n\n` +
      `Was möchtest du als erstes tun?`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🌅 Morning Check-in', 'start_morning_checkin')
          .row()
          .text('📋 Tasks hinzufügen', 'add_task')
          .row()
          .text('🔙 Zum Hauptmenü', 'show_main_menu'),
      }
    );
  });

  // ============================================
  // WORKDAY / FEIERABEND
  // ============================================

  // Day Type Selection
  bot.callbackQuery(/^day_type_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const dayType = ctx.match[1];
    await handleDayTypeCallback(ctx, dayType);
  });

  // Change Day Type (show selection again)
  bot.callbackQuery('change_day_type', async (ctx) => {
    await ctx.answerCallbackQuery();
    await dayCommand(ctx);
  });

  // Start Work Day
  bot.callbackQuery('start_work_day', async (ctx) => {
    await ctx.answerCallbackQuery('Tag gestartet! 🚀');
    await handleStartWorkDay(ctx);
  });

  // ============================================
  // NEW DAY FLOW: Check-in → Mode Selection → Tasks
  // ============================================

  // Start Day Flow (Morning)
  bot.callbackQuery('start_day_flow', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    // First: Morning Check-in
    await ctx.editMessageText(
      `☀️ *Guten Morgen!*\n\n` +
      `Lass uns deinen Tag starten.\n` +
      `Zuerst ein kurzer Check-in:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📝 Check-in starten', 'start_morning_checkin')
          .row()
          .text('⏭️ Überspringen', 'select_work_mode'),
      }
    );
  });

  // Select Work Mode (after check-in or skip)
  bot.callbackQuery('select_work_mode', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    await ctx.editMessageText(
      `🕐 *Was steht heute an?*\n\n` +
      `Wähle deinen Modus:\n\n` +
      `🏗️ *Arbeitszeit*\n` +
      `_Du bist bei der Arbeit (Baustelle, Büro, etc.)_\n` +
      `→ Nur Mini-Habits & Erinnerungen\n\n` +
      `💻 *Fokuszeit*\n` +
      `_Du hast Zeit für deine Ziele_\n` +
      `→ Tasks aus deinen Zielen generieren`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🏗️ Arbeitszeit', 'set_mode_working')
          .text('💻 Fokuszeit', 'set_mode_focus')
          .row()
          .text('🧘 Recovery Tag', 'set_mode_recovery')
          .row()
          .text('🔙 Zurück', 'show_main_menu'),
      }
    );
  });

  // Set Mode: Working (at job)
  bot.callbackQuery('set_mode_working', async (ctx) => {
    await ctx.answerCallbackQuery('Arbeitszeit aktiviert 🏗️');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const today = formatDate(new Date());
    await supabase
      .from('work_status')
      .upsert({
        user_id: user.id,
        date: today,
        work_mode: 'working',
        work_start: new Date().toISOString(),
      });

    await ctx.editMessageText(
      `🏗️ *Arbeitszeit gestartet!*\n\n` +
      `Ich werde dich nicht mit Tasks nerven.\n\n` +
      `Stattdessen erinnere ich dich an:\n` +
      `• 💧 Wasser trinken\n` +
      `• 🚶 Bewegungspausen\n` +
      `• 🍎 Gesunde Snacks\n\n` +
      `_Wenn du Zeit für deine Ziele hast, wechsle zu Fokuszeit._`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('💻 Zu Fokuszeit wechseln', 'switch_to_focus')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );
  });

  // Set Mode: Focus (time for goals)
  bot.callbackQuery('set_mode_focus', async (ctx) => {
    await ctx.answerCallbackQuery('Fokuszeit aktiviert 💻');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const today = formatDate(new Date());
    await supabase
      .from('work_status')
      .upsert({
        user_id: user.id,
        date: today,
        work_mode: 'focus',
        work_start: new Date().toISOString(),
      });

    // Check if check-in was done
    const { data: dailyLog } = await supabase
      .from('daily_logs')
      .select('morning_energy, morning_mood')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (dailyLog?.morning_energy && dailyLog?.morning_mood) {
      // Generate tasks based on goals
      await ctx.editMessageText(
        `💻 *Fokuszeit gestartet!*\n\n` +
        `Soll ich Tasks aus deinen Zielen generieren?`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('✅ Tasks generieren', 'generate_daily_tasks')
            .row()
            .text('📋 Meine Tasks anzeigen', 'menu_tasks')
            .row()
            .text('🏠 Hauptmenü', 'show_main_menu'),
        }
      );
    } else {
      await ctx.editMessageText(
        `💻 *Fokuszeit gestartet!*\n\n` +
        `Für bessere Task-Vorschläge, mach zuerst einen Check-in:`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('📝 Check-in machen', 'start_morning_checkin')
            .row()
            .text('⏭️ Überspringen & Tasks generieren', 'generate_daily_tasks')
            .row()
            .text('🏠 Hauptmenü', 'show_main_menu'),
        }
      );
    }
  });

  // Set Mode: Recovery
  bot.callbackQuery('set_mode_recovery', async (ctx) => {
    await ctx.answerCallbackQuery('Recovery Tag aktiviert 🧘');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const today = formatDate(new Date());
    await supabase
      .from('work_status')
      .upsert({
        user_id: user.id,
        date: today,
        work_mode: 'recovery',
        day_type: 'recovery',
      });

    await ctx.editMessageText(
      `🧘 *Recovery Tag aktiviert!*\n\n` +
      `Heute ist Erholung angesagt.\n` +
      `Kein Druck, keine Pflichten.\n\n` +
      `Empfehlungen:\n` +
      `• 😴 Ausschlafen / Naps\n` +
      `• 🚶 Leichte Bewegung\n` +
      `• 📵 Digital Detox\n` +
      `• 🧘 Meditation / Entspannung\n\n` +
      `_Genieß den Tag!_`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );
  });

  // Switch to Focus Mode
  bot.callbackQuery('switch_to_focus', async (ctx) => {
    await ctx.answerCallbackQuery('Wechsle zu Fokuszeit...');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const today = formatDate(new Date());
    await supabase
      .from('work_status')
      .update({ work_mode: 'focus' })
      .eq('user_id', user.id)
      .eq('date', today);

    await ctx.editMessageText(
      `💻 *Fokuszeit!*\n\n` +
      `Jetzt ist Zeit für deine Ziele.\n` +
      `Soll ich Tasks generieren?`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('✅ Tasks generieren', 'generate_daily_tasks')
          .row()
          .text('📋 Meine Tasks', 'menu_tasks')
          .text('🍅 Pomodoro', 'menu_pomodoro')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );
  });

  // Switch to Working Mode
  bot.callbackQuery('switch_to_working', async (ctx) => {
    await ctx.answerCallbackQuery('Wechsle zu Arbeitszeit...');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const today = formatDate(new Date());
    await supabase
      .from('work_status')
      .update({ work_mode: 'working' })
      .eq('user_id', user.id)
      .eq('date', today);

    await ctx.editMessageText(
      `🏗️ *Arbeitszeit!*\n\n` +
      `Ich halte mich zurück mit Tasks.\n` +
      `Fokussier dich auf deine Arbeit! 💪`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('💻 Zu Fokuszeit wechseln', 'switch_to_focus')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );
  });

  // Feierabend Confirm (Quick from status)
  bot.callbackQuery('confirm_feierabend_quick', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleFeierabendCallback(ctx, 'confirm');
  });

  // Feierabend Confirm
  bot.callbackQuery('confirm_feierabend', async (ctx) => {
    await ctx.answerCallbackQuery('Feierabend! 🏠');
    await handleFeierabendCallback(ctx, 'confirm');
  });

  // Feierabend Cancel
  bot.callbackQuery('cancel_feierabend', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleFeierabendCallback(ctx, 'cancel');
  });

  // Evening Review after Feierabend
  bot.callbackQuery('start_evening_review', async (ctx) => {
    await ctx.answerCallbackQuery();
    await startEveningCheckin(ctx);
  });

  // ============================================
  // AI TASK GENERATION
  // ============================================

  bot.callbackQuery('generate_daily_tasks', async (ctx) => {
    await ctx.answerCallbackQuery('⏳ Generiere Tasks...');
    const telegramId = ctx.from?.id;
    
    if (!telegramId) return;
    
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
        
      if (!user) return;
      
      // Get checkin data from session or use defaults
      const checkinData: { mood: number; energy: number; sleepHours?: number; sleepQuality?: number } = {
        mood: ctx.session.lastCheckinData?.mood ?? 7,
        energy: ctx.session.lastCheckinData?.energy ?? 7,
        sleepHours: ctx.session.lastCheckinData?.sleepHours,
        sleepQuality: ctx.session.lastCheckinData?.sleepQuality,
      };
      
      // Get current work mode
      const today = formatDate(new Date());
      const { data: workStatus } = await supabase
        .from('work_status')
        .select('work_mode')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
      
      const workMode = (workStatus?.work_mode || 'focus') as 'focus' | 'working' | 'recovery';
      
      await ctx.editMessageText(
        `🤖 *GOAL-FIRST Task-Generator*\n\n` +
        `⏳ Analysiere deine Ziele...\n` +
        `🧠 Suche beste Strategien...\n` +
        `✨ Generiere optimale Tasks...\n\n` +
        `_Das dauert nur wenige Sekunden..._`,
        { parse_mode: 'Markdown' }
      );
      
      // Generate GOAL-FIRST tasks
      const generatedTasks = await generateDailyTasks(user.id, checkinData, workMode);
      
      if (generatedTasks.length === 0) {
        await ctx.editMessageText(
          `🤖 *GOAL-FIRST Task-Generator*\n\n` +
          `⚠️ Du hast noch keine aktiven Ziele!\n\n` +
          `Damit ich dir die besten Tasks vorschlagen kann, brauchst du mindestens ein Ziel.\n\n` +
          `_Tipp: Je detaillierter dein Ziel + "Warum", desto besser meine Vorschläge!_`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('🎯 Ziel erstellen', 'create_goal')
              .row()
              .text('📋 Tasks selbst planen', 'menu_tasks')
              .row()
              .text('🏠 Hauptmenü', 'show_main_menu'),
          }
        );
        return;
      }
      
      // Store generated tasks in session for confirmation
      ctx.session.generatedTasks = generatedTasks;
      
      // Format tasks with GOAL-FIRST display
      const priorityEmoji: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
      const energyEmoji: Record<string, string> = { high: '🔥', medium: '⚡', low: '💤' };
      
      // Group tasks by goal
      const tasksByGoal: Record<string, typeof generatedTasks> = {};
      for (const task of generatedTasks) {
        const goal = task.goal_title || 'Sonstiges';
        if (!tasksByGoal[goal]) tasksByGoal[goal] = [];
        tasksByGoal[goal].push(task);
      }
      
      let taskList = '';
      for (const [goal, tasks] of Object.entries(tasksByGoal)) {
        taskList += `\n🎯 *Für "${goal}":*\n`;
        for (const t of tasks) {
          taskList += `   ${priorityEmoji[t.priority]} ${t.title}\n`;
          taskList += `   ${energyEmoji[t.energy_required]} ~${t.estimated_minutes}min\n`;
          taskList += `   _→ ${t.reason}_\n\n`;
        }
      }
      
      await ctx.editMessageText(
        `🤖 *GOAL-FIRST Task-Vorschläge*\n\n` +
        `📊 Energie: ${checkinData.energy}/10 | 😊 Stimmung: ${checkinData.mood}/10\n` +
        `${taskList}\n` +
        `*Was möchtest du tun?*`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('✅ Alle übernehmen', 'accept_all_tasks')
            .row()
            .text('📝 Einzeln auswählen', 'select_tasks')
            .text('🔄 Neu generieren', 'generate_daily_tasks')
            .row()
            .text('❌ Abbrechen', 'menu_tasks'),
        }
      );
    } catch (error) {
      logger.error('Error generating tasks:', error);
      await ctx.editMessageText(
        `❌ Fehler bei der Task-Generierung.\n\nBitte versuche es erneut.`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('🔄 Erneut versuchen', 'generate_daily_tasks')
            .text('📋 Selbst planen', 'menu_tasks'),
        }
      );
    }
  });

  // Accept all generated tasks
  bot.callbackQuery('accept_all_tasks', async (ctx) => {
    const telegramId = ctx.from?.id;
    const generatedTasks = ctx.session.generatedTasks;
    
    if (!telegramId || !generatedTasks || generatedTasks.length === 0) {
      await ctx.answerCallbackQuery('Keine Tasks zum Speichern');
      return;
    }
    
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
        
      if (!user) return;
      
      const savedIds = await saveGeneratedTasks(user.id, generatedTasks);
      
      ctx.session.generatedTasks = undefined;
      
      await ctx.answerCallbackQuery(`✅ ${savedIds.length} Tasks erstellt!`);
      await ctx.editMessageText(
        `✅ *${savedIds.length} Tasks erstellt!*\n\n` +
        `Dein Tag ist geplant. Los geht's! 💪\n\n` +
        `_Tipp: Starte mit dem wichtigsten Task (Eat the Frog!)_`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('📋 Tasks anzeigen', 'menu_tasks')
            .text('🏠 Hauptmenü', 'show_main_menu'),
        }
      );
    } catch (error) {
      logger.error('Error saving tasks:', error);
      await ctx.answerCallbackQuery('Fehler beim Speichern');
    }
  });

  // Select individual tasks
  bot.callbackQuery('select_tasks', async (ctx) => {
    const generatedTasks = ctx.session.generatedTasks;
    
    if (!generatedTasks || generatedTasks.length === 0) {
      await ctx.answerCallbackQuery('Keine Tasks vorhanden');
      return;
    }
    
    await ctx.answerCallbackQuery();
    
    const keyboard = new InlineKeyboard();
    generatedTasks.forEach((task, index) => {
      const shortTitle = task.title.length > 25 ? task.title.slice(0, 22) + '...' : task.title;
      keyboard.text(`✅ ${index + 1}. ${shortTitle}`, `add_single_task_${index}`);
      keyboard.row();
    });
    keyboard.text('✅ Fertig', 'menu_tasks');
    
    await ctx.editMessageText(
      `📝 *Tasks auswählen*\n\n` +
      `Klicke auf die Tasks, die du übernehmen möchtest:`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    );
  });

  // Add single task from generated list
  bot.callbackQuery(/^add_single_task_(\d+)$/, async (ctx) => {
    const index = parseInt(ctx.match[1]);
    const generatedTasks = ctx.session.generatedTasks;
    const telegramId = ctx.from?.id;
    
    if (!generatedTasks || !generatedTasks[index] || !telegramId) {
      await ctx.answerCallbackQuery('Task nicht gefunden');
      return;
    }
    
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
        
      if (!user) return;
      
      const task = generatedTasks[index];
      await saveGeneratedTasks(user.id, [task]);
      
      // Remove from list
      generatedTasks.splice(index, 1);
      ctx.session.generatedTasks = generatedTasks;
      
      await ctx.answerCallbackQuery(`✅ "${task.title}" hinzugefügt!`);
      
      if (generatedTasks.length === 0) {
        await ctx.editMessageText(
          `✅ Alle ausgewählten Tasks hinzugefügt!`,
          {
            parse_mode: 'Markdown',
            reply_markup: new InlineKeyboard()
              .text('📋 Tasks anzeigen', 'menu_tasks')
              .text('🏠 Hauptmenü', 'show_main_menu'),
          }
        );
      } else {
        // Update selection list
        const keyboard = new InlineKeyboard();
        generatedTasks.forEach((t, i) => {
          const shortTitle = t.title.length > 25 ? t.title.slice(0, 22) + '...' : t.title;
          keyboard.text(`✅ ${i + 1}. ${shortTitle}`, `add_single_task_${i}`);
          keyboard.row();
        });
        keyboard.text('✅ Fertig', 'menu_tasks');
        
        await ctx.editMessageText(
          `📝 *Tasks auswählen*\n\n` +
          `Noch ${generatedTasks.length} Task(s) verfügbar:`,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          }
        );
      }
    } catch (error) {
      logger.error('Error adding single task:', error);
      await ctx.answerCallbackQuery('Fehler beim Hinzufügen');
    }
  });

  // ============================================
  // COACH INTERACTIONS
  // ============================================

  bot.callbackQuery('coach_motivation', async (ctx) => {
    await handleCoachInteraction(ctx, 'motivation');
  });

  bot.callbackQuery('coach_daily_goal', async (ctx) => {
    await handleCoachInteraction(ctx, 'daily_goal');
  });

  bot.callbackQuery('coach_decision', async (ctx) => {
    await handleCoachInteraction(ctx, 'decision');
  });

  bot.callbackQuery('coach_reflection', async (ctx) => {
    await handleCoachInteraction(ctx, 'reflection');
  });

  // ============================================
  // REFRESH CALLBACKS
  // ============================================

  bot.callbackQuery('refresh_tasks', async (ctx) => {
    await ctx.answerCallbackQuery('Aktualisiert!');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
      
    if (user) {
      await showTasksList(ctx, user.id, true);
    }
  });

  bot.callbackQuery('refresh_habits', async (ctx) => {
    await ctx.answerCallbackQuery('Aktualisiert!');
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
      
    if (user) {
      await showHabitsList(ctx, user.id, true);
    }
  });

  // ============================================
  // HABIT COMPLETION (Uses new system)
  // ============================================

  bot.callbackQuery(/^habit_done_(.+)$/, async (ctx) => {
    const habitId = ctx.match[1];
    await completeHabit(ctx, habitId);
  });

  // ============================================
  // FALLBACK
  // ============================================

  bot.on('callback_query:data', async (ctx) => {
    logger.warn(`Unbekannter Callback: ${ctx.callbackQuery.data}`);
    await ctx.answerCallbackQuery('Diese Funktion kommt bald! 🚀');
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function saveMorningCheckin(ctx: BotContext, mood: number) {
  const telegramId = ctx.from?.id;

  if (!telegramId || !ctx.session.checkinData) {
    await ctx.answerCallbackQuery('Fehler beim Check-in');
    return;
  }

  ctx.session.checkinData.mood = mood;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.answerCallbackQuery('User nicht gefunden');
      return;
    }

    const today = formatDate(new Date());
    const checkinData = ctx.session.checkinData;

    await supabase
      .from('daily_logs')
      .upsert({
        user_id: user.id,
        date: today,
        morning_mood: checkinData.mood,
        morning_energy: checkinData.energy,
        sleep_hours: checkinData.sleepHours,
        sleep_quality: checkinData.sleepQuality,
      }, {
        onConflict: 'user_id,date',
      });

    // Create recurring tasks first
    const recurringCount = await createRecurringTasks(user.id);
    
    // Generate coach message
    const coachMessage = await generateCoachMessage(user.id, 'morning', checkinData);

    // Store checkin data for later use
    ctx.session.lastCheckinData = {
      mood: checkinData.mood,
      energy: checkinData.energy,
      sleepHours: checkinData.sleepHours,
      sleepQuality: checkinData.sleepQuality,
    };

    await ctx.answerCallbackQuery('Check-in gespeichert! ✅');
    
    let recurringMsg = '';
    if (recurringCount > 0) {
      recurringMsg = `\n📅 _${recurringCount} wiederkehrende Task(s) erstellt_\n`;
    }

    await ctx.editMessageText(
      `🌅 *Morning Check-in abgeschlossen!*\n\n` +
      `📊 *Deine Werte:*\n` +
      `😴 Schlaf: ${checkinData.sleepHours}h (Qualität: ${checkinData.sleepQuality}/10)\n` +
      `⚡ Energie: ${checkinData.energy}/10\n` +
      `😊 Stimmung: ${checkinData.mood}/10\n` +
      `${recurringMsg}\n` +
      `💬 *Dein Coach sagt:*\n` +
      `"${coachMessage}"\n\n` +
      `🤖 *Soll ich dir Tasks für heute vorschlagen?*`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('✨ Ja, Tasks generieren!', 'generate_daily_tasks')
          .row()
          .text('📋 Nein, selbst planen', 'menu_tasks')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );

    ctx.session.checkinData = undefined;
    ctx.session.step = undefined;
  } catch (error) {
    logger.error('Error saving morning check-in:', error);
    await ctx.answerCallbackQuery('Fehler beim Speichern');
  }
}

async function saveEveningCheckin(ctx: BotContext, energy: number) {
  const telegramId = ctx.from?.id;

  if (!telegramId || !ctx.session.checkinData) {
    await ctx.answerCallbackQuery('Fehler beim Check-in');
    return;
  }

  ctx.session.checkinData.energy = energy;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.answerCallbackQuery('User nicht gefunden');
      return;
    }

    const today = formatDate(new Date());
    const checkinData = ctx.session.checkinData;

    await supabase
      .from('daily_logs')
      .upsert({
        user_id: user.id,
        date: today,
        evening_mood: checkinData.mood,
        evening_energy: energy,
      }, {
        onConflict: 'user_id,date',
      });

    await ctx.answerCallbackQuery('Abend-Reflexion gespeichert! ✅');
    await ctx.editMessageText(
      `🌙 *Abend-Reflexion abgeschlossen!*\n\n` +
      `📊 *Deine Werte:*\n` +
      `😊 Stimmung: ${checkinData.mood}/10\n` +
      `⚡ Energie: ${energy}/10\n\n` +
      `🌟 Gute Nacht! Morgen wird ein neuer Tag voller Möglichkeiten.`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📊 Tages-Statistik', 'menu_stats')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );

    ctx.session.checkinData = undefined;
    ctx.session.step = undefined;
  } catch (error) {
    logger.error('Error saving evening check-in:', error);
    await ctx.answerCallbackQuery('Fehler beim Speichern');
  }
}

// Old helper functions removed - using new modular system from commands/

// ============================================
// COACH INTERACTION HELPER
// ============================================

async function handleCoachInteraction(ctx: BotContext, type: 'motivation' | 'daily_goal' | 'decision' | 'reflection') {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from?.id;
  
  if (!telegramId) {
    await ctx.editMessageText('❌ Fehler aufgetreten.');
    return;
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.editMessageText('❌ Nutze /start um zu beginnen.');
      return;
    }

    // Show typing
    await ctx.editMessageText(
      `💬 *Coach denkt nach...*\n\n_Analysiere deine Daten..._`,
      { parse_mode: 'Markdown' }
    );

    const prompts: Record<string, string> = {
      motivation: 'Gib mir einen motivierenden Push für heute. Beziehe dich auf meine aktuellen Tasks und Ziele.',
      daily_goal: 'Was sollte mein wichtigstes Ziel für heute sein, basierend auf meinen offenen Tasks und Zielen? Gib mir eine klare Empfehlung.',
      decision: 'Ich brauche Hilfe bei einer Entscheidung. Was ist aktuell die wichtigste Sache auf die ich mich fokussieren sollte?',
      reflection: 'Hilf mir kurz über meinen Tag zu reflektieren. Was lief gut, was kann ich verbessern?',
    };

    const titles: Record<string, string> = {
      motivation: '💪 Motivation',
      daily_goal: '🎯 Tagesziel',
      decision: '🤔 Entscheidungshilfe',
      reflection: '📝 Reflexion',
    };

    const response = await chatWithCoach(user.id, prompts[type]);

    await ctx.editMessageText(
      `${titles[type]}\n\n` +
      `💬 *Dein Coach:*\n\n${response}`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('💬 Weiter reden', 'menu_coach')
          .text('📋 Tasks', 'menu_tasks')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error in coach interaction:', error);
    await ctx.editMessageText(
      '❌ Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🔄 Erneut versuchen', `coach_${type}`)
          .text('🏠 Menü', 'show_main_menu'),
      }
    );
  }
}

