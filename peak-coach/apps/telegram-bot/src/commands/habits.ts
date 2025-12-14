// ============================================
// PEAK COACH - Habits Command
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';

// ============================================
// KEYBOARDS
// ============================================

export function getFrequencyKeyboard() {
  return new InlineKeyboard()
    .text('📅 Täglich', 'habit_freq_daily')
    .row()
    .text('📆 Wochentags', 'habit_freq_weekdays')
    .row()
    .text('🗓️ Wöchentlich', 'habit_freq_weekly')
    .row()
    .text('❌ Abbrechen', 'show_main_menu');
}

export function getCategoryKeyboard() {
  return new InlineKeyboard()
    .text('💪 Fitness', 'habit_cat_fitness')
    .text('🧠 Mental', 'habit_cat_mental')
    .row()
    .text('📚 Lernen', 'habit_cat_learning')
    .text('💼 Arbeit', 'habit_cat_work')
    .row()
    .text('🏠 Lifestyle', 'habit_cat_lifestyle')
    .text('🎯 Sonstiges', 'habit_cat_other')
    .row()
    .text('❌ Abbrechen', 'show_main_menu');
}

// ============================================
// MAIN COMMAND
// ============================================

export async function habitsCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('❌ Fehler beim Laden der Habits.');
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

    await showHabitsList(ctx, user.id);
  } catch (error) {
    logger.error('Error in habits command:', error);
    await ctx.reply('❌ Ein Fehler ist aufgetreten.');
  }
}

// ============================================
// SHOW HABITS LIST
// ============================================

export async function showHabitsList(ctx: BotContext, userId: string, edit = false) {
  const today = formatDate(new Date());
  
  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    logger.error('Error fetching habits:', error);
    return;
  }

  // Get today's logs
  const { data: todayLogs } = await supabase
    .from('habit_logs')
    .select('habit_id, completed')
    .eq('date', today)
    .in('habit_id', (habits || []).map(h => h.id));

  const completedToday = new Set(
    (todayLogs || []).filter(l => l.completed).map(l => l.habit_id)
  );

  let message = `🔄 *Deine Habits*\n`;
  message += `📅 ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n`;

  if (!habits || habits.length === 0) {
    message += `_Noch keine Habits eingerichtet._\n\n`;
    message += `💡 Starte mit kleinen, täglichen Gewohnheiten für maximalen Erfolg!`;
  } else {
    const completed = completedToday.size;
    const total = habits.length;
    const rate = Math.round((completed / total) * 100);

    // Progress bar
    const progressBars = Math.round(rate / 10);
    const progressBar = '█'.repeat(progressBars) + '░'.repeat(10 - progressBars);
    message += `${progressBar} ${rate}%\n\n`;

    habits.forEach((habit) => {
      const isCompleted = completedToday.has(habit.id);
      const status = isCompleted ? '✅' : '⬜';
      const streak = habit.current_streak > 0 ? ` 🔥${habit.current_streak}` : '';
      const best = habit.best_streak > 0 ? ` (Best: ${habit.best_streak})` : '';
      
      message += `${status} ${habit.name}${streak}${best}\n`;
    });

    message += `\n📊 *Fortschritt:* ${completed}/${total} Habits`;
    
    if (rate === 100) {
      message += `\n\n🎉 *Alle Habits erledigt! Streak gesichert!*`;
    }
  }

  const keyboard = new InlineKeyboard();
  
  // Add habit completion buttons if there are pending habits
  const pendingHabits = (habits || []).filter(h => !completedToday.has(h.id));
  if (pendingHabits.length > 0) {
    pendingHabits.slice(0, 6).forEach((habit, index) => {
      const shortName = habit.name.length > 15 ? habit.name.slice(0, 12) + '...' : habit.name;
      keyboard.text(`✅ ${shortName}`, `habit_done_${habit.id}`);
      if (index % 2 === 1 || index === pendingHabits.length - 1) keyboard.row();
    });
    keyboard.row();
  }

  keyboard
    .text('➕ Neuer Habit', 'habit_create_start')
    .text('🔄 Aktualisieren', 'refresh_habits')
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
// CREATE HABIT FLOW
// ============================================

export async function startHabitCreation(ctx: BotContext) {
  ctx.session.step = 'habit_create_name';
  ctx.session.habitData = {};

  await ctx.editMessageText(
    `➕ *Neuen Habit erstellen*\n\n` +
    `Schreibe mir den *Namen* des Habits:\n\n` +
    `_Beispiel: "10 Min Meditation" oder "100 Liegestütze"_`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('❌ Abbrechen', 'menu_habits'),
    }
  );
}

export async function handleHabitName(ctx: BotContext, name: string) {
  if (!ctx.session.habitData) ctx.session.habitData = {};
  ctx.session.habitData.name = name;
  ctx.session.step = 'habit_create_frequency';

  await ctx.reply(
    `✅ Name: *${name}*\n\n` +
    `Wie oft möchtest du diesen Habit ausführen?`,
    {
      parse_mode: 'Markdown',
      reply_markup: getFrequencyKeyboard(),
    }
  );
}

export async function handleHabitFrequency(ctx: BotContext, frequency: string) {
  if (!ctx.session.habitData) return;
  ctx.session.habitData.frequency = frequency;
  ctx.session.step = 'habit_create_category';

  const freqText = {
    daily: '📅 Täglich',
    weekdays: '📆 Wochentags',
    weekly: '🗓️ Wöchentlich'
  }[frequency] || frequency;

  await ctx.editMessageText(
    `✅ Häufigkeit: *${freqText}*\n\n` +
    `In welche *Kategorie* gehört dieser Habit?`,
    {
      parse_mode: 'Markdown',
      reply_markup: getCategoryKeyboard(),
    }
  );
}

export async function handleHabitCategory(ctx: BotContext, category: string) {
  if (!ctx.session.habitData) return;
  ctx.session.habitData.category = category;
  
  // Save the habit
  await saveHabit(ctx);
}

export async function saveHabit(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.session.habitData) return;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const habitData = ctx.session.habitData;

    const { error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name: habitData.name,
        frequency: habitData.frequency || 'daily',
        category: habitData.category || 'other',
        is_active: true,
        current_streak: 0,
        best_streak: 0,
      });

    if (error) throw error;

    // Clear session
    ctx.session.step = undefined;
    ctx.session.habitData = undefined;

    const catEmoji: Record<string, string> = {
      fitness: '💪', mental: '🧠', learning: '📚',
      work: '💼', lifestyle: '🏠', other: '🎯'
    };
    
    await ctx.reply(
      `✅ *Habit erstellt!*\n\n` +
      `${catEmoji[habitData.category || 'other'] || '🎯'} ${habitData.name}\n\n` +
      `💪 Dein neuer Streak startet jetzt!`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🔄 Alle Habits', 'menu_habits')
          .text('➕ Noch ein Habit', 'habit_create_start')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error saving habit:', error);
    await ctx.reply('❌ Fehler beim Speichern. Bitte versuche es erneut.');
  }
}

// ============================================
// COMPLETE HABIT
// ============================================

export async function completeHabit(ctx: BotContext, habitId: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const today = formatDate(new Date());

    // Upsert habit log
    await supabase
      .from('habit_logs')
      .upsert({
        habit_id: habitId,
        user_id: user.id,
        date: today,
        completed: true,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'habit_id,date',
      });

    // Update streak
    const { data: habit } = await supabase
      .from('habits')
      .select('current_streak, best_streak')
      .eq('id', habitId)
      .single();

    if (habit) {
      const newStreak = (habit.current_streak || 0) + 1;
      const newBest = Math.max(habit.best_streak || 0, newStreak);

      await supabase
        .from('habits')
        .update({
          current_streak: newStreak,
          best_streak: newBest,
        })
        .eq('id', habitId);

      // Special messages for streaks
      let streakMsg = '';
      if (newStreak === 7) streakMsg = '\n\n🎉 *1 Woche Streak!* Du bist auf dem richtigen Weg!';
      else if (newStreak === 30) streakMsg = '\n\n🏆 *30 Tage Streak!* Du bist unaufhaltbar!';
      else if (newStreak === 100) streakMsg = '\n\n👑 *100 Tage Streak!* LEGENDÄR!';
      else if (newStreak % 10 === 0) streakMsg = `\n\n🔥 *${newStreak} Tage Streak!* Weiter so!`;

      await ctx.answerCallbackQuery(`✅ Habit erledigt! 🔥 Streak: ${newStreak}`);
      
      if (streakMsg) {
        await ctx.reply(streakMsg, { parse_mode: 'Markdown' });
      }
    } else {
      await ctx.answerCallbackQuery('✅ Habit erledigt!');
    }

    // Refresh habits list
    await showHabitsList(ctx, user.id, true);
  } catch (error) {
    logger.error('Error completing habit:', error);
    await ctx.answerCallbackQuery('Fehler beim Speichern');
  }
}
