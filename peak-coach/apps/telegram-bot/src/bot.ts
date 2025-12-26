// ============================================
// PEAK COACH - Bot Instance Configuration
// ============================================

import { Bot, Context, session, SessionFlavor } from 'grammy';

// Session data interface
interface SessionData {
  step?: string;
  checkinData?: {
    type: 'morning' | 'evening';
    mood?: number;
    energy?: number;
    sleepHours?: number;
    sleepQuality?: number;
  };
  lastCheckinData?: {
    mood?: number;
    energy?: number;
    sleepHours?: number;
    sleepQuality?: number;
  };
  taskData?: {
    taskId?: string;
    title?: string;
    priority?: string;
    energy?: string;
    time?: string | null;
  };
  habitData?: {
    habitId?: string;
    name?: string;
    frequency?: string;
    category?: string;
  };
  generatedTasks?: Array<{
    title: string;
    priority: 'high' | 'medium' | 'low';
    energy_required: 'high' | 'medium' | 'low';
    estimated_minutes: number;
    reason: string;
  }>;
  recurringTaskData?: {
    title?: string;
    frequency?: string;
    priority?: string;
  };
  goalData?: {
    goalId?: string;
    title?: string;
    originalTitle?: string;
    category?: string;
    timeframe?: string;
    targetValue?: number | null;
    whyImportant?: string | null;
    deadline?: string;
    suggestedMilestones?: string[];
    expertInsights?: string[];
  };
}

// Custom context type
export type BotContext = Context & SessionFlavor<SessionData>;

// Validate environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// Create bot instance
export const bot = new Bot<BotContext>(BOT_TOKEN);

// Setup session middleware
bot.use(session({
  initial: (): SessionData => ({}),
}));

// Error handler
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  console.error(err.error);
});

