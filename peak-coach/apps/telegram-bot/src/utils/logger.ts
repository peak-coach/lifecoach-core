// ============================================
// PEAK COACH - Logger Utility
// ============================================

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const levels: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: string): boolean {
  return levels[level] >= levels[LOG_LEVEL];
}

function formatMessage(level: string, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(a => 
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ') : '';
  
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
}

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, ...args));
    }
  },

  info: (message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, ...args));
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, ...args));
    }
  },

  error: (message: string, ...args: any[]) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, ...args));
    }
  },
};

