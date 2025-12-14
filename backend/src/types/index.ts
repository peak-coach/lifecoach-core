/**
 * LifeCoach Core API - Type Re-exports
 * 
 * Diese Datei re-exportiert alle Types aus den Schema-Dateien
 * für einfacheren Import in anderen Modulen.
 */

// Re-export all schemas and types
export * from '../schemas/index.js';

// Legacy compatibility - Config types bleiben hier
export interface AppConfig {
  port: number;
  nodeEnv: string;
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
  notion: {
    apiKey: string;
    dbTasksId: string;
    dbDailyLogId: string;
    dbAreasId: string;
    dbPrinciplesId: string;
  };
  llm: {
    provider: string;
    openaiApiKey: string;
    model: string;
  };
  telegram: {
    botToken: string;
  };
  lifecoachApiBaseUrl: string;
}
