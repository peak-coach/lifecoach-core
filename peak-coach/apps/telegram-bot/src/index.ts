// ============================================
// PEAK COACH - Telegram Bot Entry Point
// ============================================

import 'dotenv/config';
import { bot } from './bot';
import { setupCommands } from './commands';
import { setupCallbacks } from './handlers/callback';
import { setupMessageHandlers } from './handlers/message';
import { setupScheduler } from './services/scheduler';
import { logger } from './utils/logger';

async function main() {
  logger.info('🚀 Starting Peak Coach Telegram Bot...');

  try {
    // Setup bot commands
    await setupCommands(bot);
    logger.info('✅ Commands registered');

    // Setup callback handlers
    setupCallbacks(bot);
    logger.info('✅ Callback handlers registered');

    // Setup message handlers (for text input)
    setupMessageHandlers(bot);
    logger.info('✅ Message handlers registered');

    // Setup scheduled notifications
    setupScheduler();
    logger.info('✅ Scheduler started');

    // Start the bot
    await bot.start({
      onStart: (botInfo) => {
        logger.info(`✅ Bot started as @${botInfo.username}`);
        logger.info('🏆 Peak Performance Coach is ready!');
      },
    });
  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  bot.stop();
  process.exit(0);
});

main();

