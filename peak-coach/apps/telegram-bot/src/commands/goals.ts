// ============================================
// PEAK COACH - Goals Command (German + Full CRUD)
// ============================================

import { BotContext } from '../bot';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../services/supabase';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';

// ============================================
// KEYBOARDS
// ============================================

export function getGoalCategoryKeyboard() {
  return new InlineKeyboard()
    .text('💼 Karriere/Business', 'goal_cat_career')
    .text('💪 Fitness/Gesundheit', 'goal_cat_fitness')
    .row()
    .text('📚 Lernen/Skills', 'goal_cat_learning')
    .text('💰 Finanzen', 'goal_cat_finance')
    .row()
    .text('🧘 Mindset/Mental', 'goal_cat_mental')
    .text('❤️ Beziehungen', 'goal_cat_relationships')
    .row()
    .text('🎯 Sonstiges', 'goal_cat_other')
    .row()
    .text('❌ Abbrechen', 'show_main_menu');
}

export function getGoalTimeframeKeyboard() {
  return new InlineKeyboard()
    .text('📅 Diese Woche', 'goal_time_week')
    .row()
    .text('📆 Dieser Monat', 'goal_time_month')
    .row()
    .text('🗓️ Dieses Quartal', 'goal_time_quarter')
    .row()
    .text('🎯 Dieses Jahr', 'goal_time_year')
    .row()
    .text('❌ Abbrechen', 'show_main_menu');
}

// ============================================
// MAIN COMMAND
// ============================================

export async function goalsCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('❌ Fehler beim Laden der Ziele.');
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

    await showGoalsList(ctx, user.id);
  } catch (error) {
    logger.error('Error in goals command:', error);
    await ctx.reply('❌ Ein Fehler ist aufgetreten.');
  }
}

// ============================================
// SHOW GOALS LIST
// ============================================

export async function showGoalsList(ctx: BotContext, userId: string, edit = false) {
  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('deadline', { ascending: true, nullsFirst: false });

  if (error) {
    logger.error('Error fetching goals:', error);
    return;
  }

  const categoryEmoji: Record<string, string> = {
    career: '💼', fitness: '💪', learning: '📚',
    finance: '💰', mental: '🧘', relationships: '❤️', other: '🎯'
  };

  let message = `🎯 *Deine Ziele*\n\n`;

  if (!goals || goals.length === 0) {
    message += `_Noch keine Ziele definiert._\n\n`;
    message += `💡 Setze dir klare Ziele - der Coach plant dann deine Tasks darauf basierend!`;
  } else {
    // Group by timeframe
    const weekGoals = goals.filter(g => g.timeframe === 'week');
    const monthGoals = goals.filter(g => g.timeframe === 'month');
    const quarterGoals = goals.filter(g => g.timeframe === 'quarter');
    const yearGoals = goals.filter(g => g.timeframe === 'year');
    const otherGoals = goals.filter(g => !g.timeframe);

    if (weekGoals.length > 0) {
      message += `📅 *Diese Woche:*\n`;
      weekGoals.forEach(g => {
        const emoji = categoryEmoji[g.category] || '🎯';
        const progress = g.target_value ? ` (${g.current_value || 0}/${g.target_value})` : '';
        message += `${emoji} ${g.title}${progress}\n`;
      });
      message += '\n';
    }

    if (monthGoals.length > 0) {
      message += `📆 *Dieser Monat:*\n`;
      monthGoals.forEach(g => {
        const emoji = categoryEmoji[g.category] || '🎯';
        const progress = g.target_value ? ` (${g.current_value || 0}/${g.target_value})` : '';
        message += `${emoji} ${g.title}${progress}\n`;
      });
      message += '\n';
    }

    if (quarterGoals.length > 0) {
      message += `🗓️ *Dieses Quartal:*\n`;
      quarterGoals.forEach(g => {
        const emoji = categoryEmoji[g.category] || '🎯';
        message += `${emoji} ${g.title}\n`;
      });
      message += '\n';
    }

    if (yearGoals.length > 0) {
      message += `🎯 *Dieses Jahr:*\n`;
      yearGoals.forEach(g => {
        const emoji = categoryEmoji[g.category] || '🎯';
        message += `${emoji} ${g.title}\n`;
      });
      message += '\n';
    }

    if (otherGoals.length > 0) {
      message += `📋 *Weitere Ziele:*\n`;
      otherGoals.forEach(g => {
        const emoji = categoryEmoji[g.category] || '🎯';
        message += `${emoji} ${g.title}\n`;
      });
      message += '\n';
    }

    message += `\n_${goals.length} aktive Ziele_`;
  }

  const keyboard = new InlineKeyboard();
  
  // Add goal selection buttons if there are goals
  if (goals && goals.length > 0) {
    goals.slice(0, 5).forEach((goal, index) => {
      const shortTitle = goal.title.length > 25 ? goal.title.slice(0, 22) + '...' : goal.title;
      keyboard.text(`${index + 1}. ${shortTitle}`, `goal_select_${goal.id}`);
      keyboard.row();
    });
  }

  keyboard
    .text('➕ Neues Ziel', 'goal_create_start')
    .text('🔄 Aktualisieren', 'refresh_goals')
    .row()
    .text('📅 Weekly Planning', 'start_weekly_planning')
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
// CREATE GOAL FLOW
// ============================================

export async function startGoalCreation(ctx: BotContext) {
  ctx.session.step = 'goal_create_title';
  ctx.session.goalData = {};

  await ctx.editMessageText(
    `🎯 *Neues Ziel erstellen*\n\n` +
    `Was möchtest du erreichen?\n\n` +
    `Schreibe mir dein *Ziel*:\n\n` +
    `_Beispiel: "Businessplan fertigstellen" oder "10kg abnehmen"_`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('❌ Abbrechen', 'menu_goals'),
    }
  );
}

export async function handleGoalTitle(ctx: BotContext, title: string) {
  if (!ctx.session.goalData) ctx.session.goalData = {};
  ctx.session.goalData.title = title;
  ctx.session.step = 'goal_create_category';

  await ctx.reply(
    `✅ Ziel: *${title}*\n\n` +
    `In welche *Kategorie* gehört dieses Ziel?`,
    {
      parse_mode: 'Markdown',
      reply_markup: getGoalCategoryKeyboard(),
    }
  );
}

export async function handleGoalCategory(ctx: BotContext, category: string) {
  if (!ctx.session.goalData) return;
  ctx.session.goalData.category = category;
  ctx.session.step = 'goal_create_timeframe';

  const catText: Record<string, string> = {
    career: '💼 Karriere/Business',
    fitness: '💪 Fitness/Gesundheit',
    learning: '📚 Lernen/Skills',
    finance: '💰 Finanzen',
    mental: '🧘 Mindset/Mental',
    relationships: '❤️ Beziehungen',
    other: '🎯 Sonstiges'
  };

  await ctx.editMessageText(
    `✅ Kategorie: *${catText[category] || category}*\n\n` +
    `In welchem *Zeitraum* möchtest du das Ziel erreichen?`,
    {
      parse_mode: 'Markdown',
      reply_markup: getGoalTimeframeKeyboard(),
    }
  );
}

export async function handleGoalTimeframe(ctx: BotContext, timeframe: string) {
  if (!ctx.session.goalData) return;
  ctx.session.goalData.timeframe = timeframe;
  ctx.session.step = 'goal_create_target';

  const timeText: Record<string, string> = {
    week: '📅 Diese Woche',
    month: '📆 Dieser Monat',
    quarter: '🗓️ Dieses Quartal',
    year: '🎯 Dieses Jahr'
  };

  await ctx.editMessageText(
    `✅ Zeitraum: *${timeText[timeframe] || timeframe}*\n\n` +
    `Ist dein Ziel *messbar*?\n\n` +
    `Falls ja, schreibe den Zielwert (z.B. "10" für 10kg)\n` +
    `Falls nein, klicke "Nicht messbar"`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('📊 Nicht messbar', 'goal_target_none')
        .row()
        .text('❌ Abbrechen', 'menu_goals'),
    }
  );
}

export async function handleGoalTarget(ctx: BotContext, target: number | null) {
  if (!ctx.session.goalData) return;
  ctx.session.goalData.targetValue = target;
  ctx.session.step = 'goal_create_why';

  const targetText = target ? `${target}` : 'Nicht messbar';

  await ctx.editMessageText(
    `✅ Zielwert: *${targetText}*\n\n` +
    `🔥 *Warum ist dieses Ziel wichtig für dich?*\n\n` +
    `_Diese Antwort hilft dir, motiviert zu bleiben wenn es schwer wird._\n\n` +
    `Schreib mir 1-2 Sätze oder überspringe:`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('⏭️ Überspringen', 'goal_why_skip')
        .row()
        .text('❌ Abbrechen', 'menu_goals'),
    }
  );
}

export async function handleGoalWhy(ctx: BotContext, why: string | null) {
  if (!ctx.session.goalData) return;
  ctx.session.goalData.whyImportant = why;
  
  await saveGoal(ctx);
}

export async function saveGoal(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.session.goalData) return;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    const goalData = ctx.session.goalData;
    
    // Calculate deadline based on timeframe
    let deadline = null;
    const now = new Date();
    switch (goalData.timeframe) {
      case 'week':
        deadline = new Date(now.setDate(now.getDate() + (7 - now.getDay())));
        break;
      case 'month':
        deadline = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        deadline = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        deadline = new Date(now.getFullYear(), 11, 31);
        break;
    }

    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: goalData.title,
        category: goalData.category || 'other',
        timeframe: goalData.timeframe,
        target_value: goalData.targetValue,
        current_value: 0,
        deadline: deadline ? formatDate(deadline) : null,
        status: 'active',
        why_important: goalData.whyImportant || null,
      });

    if (error) throw error;

    // Clear session
    ctx.session.step = undefined;
    ctx.session.goalData = undefined;

    const categoryEmoji: Record<string, string> = {
      career: '💼', fitness: '💪', learning: '📚',
      finance: '💰', mental: '🧘', relationships: '❤️', other: '🎯'
    };
    const emoji = categoryEmoji[goalData.category || 'other'] || '🎯';

    await ctx.reply(
      `✅ *Ziel erstellt!*\n\n` +
      `${emoji} ${goalData.title}\n\n` +
      `🤖 Der Coach wird jetzt Tasks basierend auf diesem Ziel vorschlagen!\n\n` +
      `_Tipp: Je mehr Ziele du definierst, desto besser kann der Coach planen._`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🎯 Alle Ziele', 'menu_goals')
          .text('➕ Noch ein Ziel', 'goal_create_start')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error saving goal:', error);
    await ctx.reply('❌ Fehler beim Speichern. Bitte versuche es erneut.');
  }
}

// ============================================
// GOAL ACTIONS
// ============================================

export async function selectGoal(ctx: BotContext, goalId: string) {
  try {
    const { data: goal, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (error || !goal) {
      await ctx.answerCallbackQuery('Ziel nicht gefunden');
      return;
    }

    const categoryEmoji: Record<string, string> = {
      career: '💼', fitness: '💪', learning: '📚',
      finance: '💰', mental: '🧘', relationships: '❤️', other: '🎯'
    };
    const emoji = categoryEmoji[goal.category] || '🎯';

    const timeframeText: Record<string, string> = {
      week: 'Diese Woche',
      month: 'Dieser Monat',
      quarter: 'Dieses Quartal',
      year: 'Dieses Jahr'
    };

    let progressText = '';
    if (goal.target_value) {
      const progress = Math.round(((goal.current_value || 0) / goal.target_value) * 100);
      const progressBars = Math.round(progress / 10);
      const progressBar = '█'.repeat(progressBars) + '░'.repeat(10 - progressBars);
      progressText = `\n📊 Fortschritt: ${progressBar} ${progress}%\n   ${goal.current_value || 0}/${goal.target_value}`;
    }

    const whyText = goal.why_important ? `\n💡 *Warum:* _${goal.why_important}_\n` : '';

    await ctx.editMessageText(
      `${emoji} *${goal.title}*\n\n` +
      `📁 Kategorie: ${goal.category}\n` +
      `⏰ Zeitraum: ${timeframeText[goal.timeframe] || 'Nicht festgelegt'}\n` +
      (goal.deadline ? `📅 Deadline: ${goal.deadline}\n` : '') +
      `${progressText}${whyText}\n` +
      `_Was möchtest du tun?_`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('📈 Fortschritt updaten', `goal_update_${goalId}`)
          .row()
          .text('✅ Abgeschlossen', `goal_complete_${goalId}`)
          .text('🗑️ Löschen', `goal_delete_${goalId}`)
          .row()
          .text('🔙 Zurück', 'menu_goals'),
      }
    );
  } catch (error) {
    logger.error('Error selecting goal:', error);
    await ctx.answerCallbackQuery('Fehler beim Laden');
  }
}

export async function updateGoalProgress(ctx: BotContext, goalId: string) {
  ctx.session.step = 'goal_update_progress';
  ctx.session.goalData = { goalId };

  await ctx.editMessageText(
    `📈 *Fortschritt updaten*\n\n` +
    `Gib den neuen Wert ein:\n\n` +
    `_Beispiel: "5" wenn du 5 von 10 erreicht hast_`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('❌ Abbrechen', 'menu_goals'),
    }
  );
}

export async function handleGoalProgressUpdate(ctx: BotContext, value: number) {
  const goalId = ctx.session.goalData?.goalId;
  if (!goalId) return;

  try {
    const { data: goal } = await supabase
      .from('goals')
      .select('title, target_value')
      .eq('id', goalId)
      .single();

    await supabase
      .from('goals')
      .update({ current_value: value })
      .eq('id', goalId);

    ctx.session.step = undefined;
    ctx.session.goalData = undefined;

    let message = `✅ Fortschritt aktualisiert: *${value}*`;
    
    if (goal?.target_value && value >= goal.target_value) {
      message = `🎉 *ZIEL ERREICHT!*\n\n` +
        `Du hast "${goal.title}" geschafft!\n\n` +
        `Großartige Arbeit! 💪`;
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('🎯 Alle Ziele', 'menu_goals')
        .text('🏠 Menü', 'show_main_menu'),
    });
  } catch (error) {
    logger.error('Error updating goal progress:', error);
    await ctx.reply('❌ Fehler beim Aktualisieren.');
  }
}

export async function completeGoal(ctx: BotContext, goalId: string) {
  try {
    const { data: goal } = await supabase
      .from('goals')
      .select('title')
      .eq('id', goalId)
      .single();

    await supabase
      .from('goals')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', goalId);

    await ctx.answerCallbackQuery('🎉 Ziel abgeschlossen!');
    await ctx.editMessageText(
      `🎉 *Ziel abgeschlossen!*\n\n` +
      `✅ ${goal?.title}\n\n` +
      `Fantastische Arbeit! Was kommt als nächstes?`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('🎯 Alle Ziele', 'menu_goals')
          .text('➕ Neues Ziel', 'goal_create_start')
          .row()
          .text('🏠 Hauptmenü', 'show_main_menu'),
      }
    );
  } catch (error) {
    logger.error('Error completing goal:', error);
    await ctx.answerCallbackQuery('Fehler');
  }
}

export async function deleteGoal(ctx: BotContext, goalId: string) {
  await ctx.editMessageText(
    `🗑️ *Ziel löschen?*\n\n` +
    `Bist du sicher?\n\n` +
    `_Diese Aktion kann nicht rückgängig gemacht werden._`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('✅ Ja, löschen', `goal_delete_confirm_${goalId}`)
        .text('❌ Abbrechen', 'menu_goals'),
    }
  );
}

export async function confirmDeleteGoal(ctx: BotContext, goalId: string) {
  try {
    await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    await ctx.answerCallbackQuery('🗑️ Ziel gelöscht');
    
    const telegramId = ctx.from?.id;
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (user) {
      await showGoalsList(ctx, user.id, true);
    }
  } catch (error) {
    logger.error('Error deleting goal:', error);
    await ctx.answerCallbackQuery('Fehler beim Löschen');
  }
}

// ============================================
// WEEKLY PLANNING
// ============================================

export async function startWeeklyPlanning(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) return;

    // Get current week goals
    const { data: weekGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('timeframe', 'week')
      .eq('status', 'active');

    // Get last week's completed goals
    const { data: completedGoals } = await supabase
      .from('goals')
      .select('title')
      .eq('user_id', user.id)
      .eq('timeframe', 'week')
      .eq('status', 'completed')
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    let message = `📅 *Weekly Planning*\n\n`;
    
    if (completedGoals && completedGoals.length > 0) {
      message += `🎉 *Letzte Woche geschafft:*\n`;
      completedGoals.forEach(g => {
        message += `✅ ${g.title}\n`;
      });
      message += `\n`;
    }

    if (weekGoals && weekGoals.length > 0) {
      message += `📋 *Aktuelle Wochenziele:*\n`;
      weekGoals.forEach(g => {
        const progress = g.target_value ? ` (${g.current_value || 0}/${g.target_value})` : '';
        message += `🎯 ${g.title}${progress}\n`;
      });
      message += `\n`;
    } else {
      message += `_Noch keine Wochenziele definiert._\n\n`;
    }

    message += `💡 *Tipp:* Setze 3-5 klare Ziele für diese Woche!\n\n`;
    message += `Der Coach wird dann jeden Tag Tasks erstellen, die zu diesen Zielen beitragen.`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('➕ Wochenziel hinzufügen', 'add_week_goal')
        .row()
        .text('🗑️ Alte Ziele archivieren', 'archive_week_goals')
        .row()
        .text('🔙 Zurück', 'menu_goals'),
    });
  } catch (error) {
    logger.error('Error in weekly planning:', error);
  }
}

export async function addWeekGoal(ctx: BotContext) {
  ctx.session.step = 'goal_create_title';
  ctx.session.goalData = { timeframe: 'week' };

  await ctx.editMessageText(
    `📅 *Wochenziel hinzufügen*\n\n` +
    `Was möchtest du diese Woche erreichen?\n\n` +
    `_Beispiel: "Businessplan Kapitel 3 fertig" oder "3x Training"_`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('❌ Abbrechen', 'start_weekly_planning'),
    }
  );
}

