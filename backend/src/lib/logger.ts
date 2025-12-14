/**
 * Logger Configuration
 * 
 * Pino-basierter Logger mit:
 * - Pretty-Print im Development
 * - JSON-Logs in Production
 * - Request-Logging Middleware
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // In Production: JSON format für Log-Aggregation
  ...(isDev ? {} : {
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
});

export default logger;
