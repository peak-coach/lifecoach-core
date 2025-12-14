// ============================================
// PEAK COACH - Scheduler Service
// ============================================

import cron from 'node-cron';
import { bot } from '../bot';
import { supabase } from './supabase';
import { formatDate } from '../utils/helpers';
import { generateCoachMessage, getProactiveInsight, generateInsightMessage } from './coach';
import { sendWeeklyReportToUser } from './weeklyReport';
import { logger } from '../utils/logger';

export function setupScheduler() {
  // Morning Check-in Reminder - 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    logger.info('Running morning check-in reminder...');
    await sendMorningReminders();
  }, {
    timezone: 'Europe/Berlin',
  });

  // Midday Check - 12:00 PM
  cron.schedule('0 12 * * *', async () => {
    logger.info('Running midday check...');
    await sendMiddayCheck();
  }, {
    timezone: 'Europe/Berlin',
  });

  // Evening Review Reminder - 8:00 PM
  cron.schedule('0 20 * * *', async () => {
    logger.info('Running evening review reminder...');
    await sendEveningReminders();
  }, {
    timezone: 'Europe/Berlin',
  });

  // Habit Reminder - 9:00 PM
  cron.schedule('0 21 * * *', async () => {
    logger.info('Running habit reminder...');
    await sendHabitReminders();
  }, {
    timezone: 'Europe/Berlin',
  });

  // Proactive Insights - 10:00 AM & 3:00 PM (smart nudges)
  cron.schedule('0 10,15 * * 1-5', async () => {
    logger.info('Running proactive insights...');
    await sendProactiveInsights();
  }, {
    timezone: 'Europe/Berlin',
  });

  // Weekly Report - Sunday 8:00 PM
  cron.schedule('0 20 * * 0', async () => {
    logger.info('Running weekly reports...');
    await sendWeeklyReports();
  }, {
    timezone: 'Europe/Berlin',
  });

  logger.info('Scheduler initialized with Europe/Berlin timezone');
}

async function sendMorningReminders() {
  try {
    const today = formatDate(new Date());

    // Get users who haven't done morning check-in
    const { data: users } = await supabase
      .from('users')
      .select(`
        id,
        telegram_id,
        name,
        user_profile (notification_frequency)
      `)
      .not('telegram_id', 'is', null);

    if (!users) return;

    for (const user of users) {
      // Check if already checked in
      const { data: existingLog } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .not('morning_mood', 'is', null)
        .single();

      if (existingLog) continue;

      // Send reminder
      try {
        await bot.api.sendMessage(
          user.telegram_id!,
          `🌅 Guten Morgen${user.name ? `, ${user.name}` : ''}!\n\n` +
          `Zeit für deinen Morning Check-in. Wie hast du geschlafen?`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📝 Check-in starten', callback_data: 'start_checkin' }],
              ],
            },
          }
        );
        logger.info(`Sent morning reminder to user ${user.id}`);
      } catch (error) {
        logger.error(`Failed to send reminder to user ${user.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in sendMorningReminders:', error);
  }
}

async function sendMiddayCheck() {
  try {
    const today = formatDate(new Date());

    // Get users with tasks today
    const { data: usersWithTasks } = await supabase
      .from('users')
      .select(`
        id,
        telegram_id,
        name
      `)
      .not('telegram_id', 'is', null);

    if (!usersWithTasks) return;

    for (const user of usersWithTasks) {
      // Get today's tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', user.id)
        .eq('scheduled_date', today);

      if (!tasks || tasks.length === 0) continue;

      const completed = tasks.filter(t => t.status === 'completed').length;
      const total = tasks.length;
      const completionRate = Math.round((completed / total) * 100);

      // Only send if less than 50% completed
      if (completionRate >= 50) continue;

      try {
        await bot.api.sendMessage(
          user.telegram_id!,
          `🕛 Midday Check!\n\n` +
          `Du hast ${completed}/${total} Tasks erledigt (${completionRate}%).\n\n` +
          `Wie läuft's? Brauchst du Hilfe bei der Priorisierung?`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📋 Tasks anzeigen', callback_data: 'show_tasks' },
                  { text: '💬 Coach', callback_data: 'talk_to_coach' },
                ],
              ],
            },
          }
        );
        logger.info(`Sent midday check to user ${user.id}`);
      } catch (error) {
        logger.error(`Failed to send midday check to user ${user.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in sendMiddayCheck:', error);
  }
}

async function sendEveningReminders() {
  try {
    const today = formatDate(new Date());

    // Get users who haven't done evening review
    const { data: users } = await supabase
      .from('users')
      .select('id, telegram_id, name')
      .not('telegram_id', 'is', null);

    if (!users) return;

    for (const user of users) {
      // Check if already reviewed
      const { data: existingLog } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .not('evening_mood', 'is', null)
        .single();

      if (existingLog) continue;

      try {
        await bot.api.sendMessage(
          user.telegram_id!,
          `🌙 Zeit für deinen Evening Review!\n\n` +
          `Wie war dein Tag? Lass uns reflektieren.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📝 Review starten', callback_data: 'start_checkin' }],
              ],
            },
          }
        );
        logger.info(`Sent evening reminder to user ${user.id}`);
      } catch (error) {
        logger.error(`Failed to send evening reminder to user ${user.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in sendEveningReminders:', error);
  }
}

async function sendHabitReminders() {
  try {
    const today = formatDate(new Date());

    // Get users with incomplete habits
    const { data: users } = await supabase
      .from('users')
      .select('id, telegram_id, name')
      .not('telegram_id', 'is', null);

    if (!users) return;

    for (const user of users) {
      // Get active habits
      const { data: habits } = await supabase
        .from('habits')
        .select('id, name, current_streak')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!habits || habits.length === 0) continue;

      // Get today's completed habits
      const { data: completedToday } = await supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('completed', true);

      const completedIds = new Set((completedToday || []).map(h => h.habit_id));
      const incompleteHabits = habits.filter(h => !completedIds.has(h.id));

      if (incompleteHabits.length === 0) continue;

      // Check for streak risks
      const streakRisks = incompleteHabits.filter(h => h.current_streak > 0);

      try {
        let message = `🔄 Habit Reminder!\n\n`;
        
        if (streakRisks.length > 0) {
          message += `⚠️ Achtung! Diese Habits haben einen aktiven Streak:\n`;
          streakRisks.forEach(h => {
            message += `• ${h.name} (🔥${h.current_streak} Tage)\n`;
          });
          message += `\nVerpasse nicht deinen Streak!`;
        } else {
          message += `Du hast noch ${incompleteHabits.length} Habit(s) offen:\n`;
          incompleteHabits.forEach(h => {
            message += `• ${h.name}\n`;
          });
        }

        await bot.api.sendMessage(user.telegram_id!, message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Habits anzeigen', callback_data: 'refresh_habits' }],
            ],
          },
        });
        logger.info(`Sent habit reminder to user ${user.id}`);
      } catch (error) {
        logger.error(`Failed to send habit reminder to user ${user.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in sendHabitReminders:', error);
  }
}

async function sendWeeklyReports() {
  try {
    // Get all users with telegram_id
    const { data: users } = await supabase
      .from('users')
      .select('id, telegram_id, name')
      .not('telegram_id', 'is', null);

    if (!users || users.length === 0) {
      logger.info('No users for weekly reports');
      return;
    }

    for (const user of users) {
      if (!user.telegram_id) continue;
      
      try {
        await sendWeeklyReportToUser(user.id, user.telegram_id, bot);
        // Small delay between users to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error sending weekly report to ${user.id}:`, error);
      }
    }

    logger.info(`Sent weekly reports to ${users.length} users`);
  } catch (error) {
    logger.error('Error in sendWeeklyReports:', error);
  }
}

async function sendProactiveInsights() {
  try {
    // Get users who are currently working (work_status active)
    const today = formatDate(new Date());
    
    const { data: activeWorkDays } = await supabase
      .from('work_status')
      .select(`
        user_id,
        users!inner (
          id,
          telegram_id,
          name
        )
      `)
      .eq('date', today)
      .is('work_end', null);

    if (!activeWorkDays || activeWorkDays.length === 0) {
      logger.info('No active work days, skipping proactive insights');
      return;
    }

    for (const workDay of activeWorkDays) {
      const user = workDay.users as any;
      if (!user?.telegram_id) continue;

      try {
        // Get proactive insight
        const insight = await getProactiveInsight(user.id);
        
        if (!insight) {
          logger.info(`No insight for user ${user.id}`);
          continue;
        }

        // Generate personalized message
        const message = await generateInsightMessage(user.id, insight);

        const emoji = {
          warning: '⚠️',
          celebration: '🎉',
          suggestion: '💡',
          streak_risk: '🔥',
        }[insight.type] || '💬';

        await bot.api.sendMessage(
          user.telegram_id,
          `${emoji} *Coach Insight*\n\n${message}`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📋 Tasks', callback_data: 'menu_tasks' },
                  { text: '💬 Coach', callback_data: 'menu_coach' },
                ],
              ],
            },
          }
        );
        
        logger.info(`Sent proactive insight (${insight.type}) to user ${user.id}`);
      } catch (error) {
        logger.error(`Failed to send insight to user ${user.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in sendProactiveInsights:', error);
  }
}

