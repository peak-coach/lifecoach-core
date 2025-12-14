// ============================================
// PEAK COACH - Bot Commands Setup
// ============================================

import { Bot } from 'grammy';
import { BotContext } from '../bot';
import { startCommand } from './start';
import { checkinCommand } from './checkin';
import { tasksCommand } from './tasks';
import { habitsCommand } from './habits';
import { goalsCommand } from './goals';
import { statsCommand } from './stats';
import { coachCommand } from './coach';
import { helpCommand } from './help';
import { linkCommand, linkStatusCommand } from './link';
import { dayCommand, feierabendCommand, statusCommand } from './workday';
import { quickTaskCommand } from './quick';
import { reportCommand, quickStatsCommand } from './report';
import { patternsCommand } from './patterns';
import { pomodoroCommand } from './pomodoro';

export async function setupCommands(bot: Bot<BotContext>) {
  // Register command handlers
  bot.command('start', startCommand);
  bot.command('checkin', checkinCommand);
  bot.command('tasks', tasksCommand);
  bot.command('habits', habitsCommand);
  bot.command('goals', goalsCommand);
  bot.command('stats', statsCommand);
  bot.command('coach', coachCommand);
  bot.command('help', helpCommand);
  bot.command('link', linkCommand);
  bot.command('linkstatus', linkStatusCommand);
  
  // Workday commands
  bot.command('day', dayCommand);
  bot.command('feierabend', feierabendCommand);
  bot.command('status', statusCommand);

  // Quick task commands
  bot.command('q', quickTaskCommand);
  bot.command('quick', quickTaskCommand);

  // Report commands
  bot.command('report', reportCommand);
  bot.command('week', quickStatsCommand);
  bot.command('patterns', patternsCommand);
  bot.command('pomo', pomodoroCommand);
  bot.command('pomodoro', pomodoroCommand);

  // Set bot commands for menu
  await bot.api.setMyCommands([
    { command: 'start', description: '🚀 Bot starten / Onboarding' },
    { command: 'checkin', description: '📝 Morning/Evening Check-in' },
    { command: 'day', description: '📅 Tagestyp wählen (Normal/Montage/Recovery)' },
    { command: 'feierabend', description: '🏠 Arbeitstag beenden' },
    { command: 'status', description: '📊 Tages-Status anzeigen' },
    { command: 'tasks', description: '📋 Heutige Tasks anzeigen' },
    { command: 'habits', description: '🔄 Habits anzeigen' },
    { command: 'goals', description: '🎯 Ziele verwalten' },
    { command: 'stats', description: '📈 Statistiken anzeigen' },
    { command: 'coach', description: '💬 Mit dem Coach sprechen' },
    { command: 'link', description: '🔗 Mit Web App verknüpfen' },
    { command: 'help', description: '❓ Hilfe anzeigen' },
  ]);
}

