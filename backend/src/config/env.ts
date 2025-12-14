/**
 * Environment Configuration
 * 
 * Lädt und validiert alle Umgebungsvariablen beim Start.
 * Beendet den Prozess mit klarer Fehlermeldung, wenn Pflicht-Variablen fehlen.
 */

import 'dotenv/config';
import { z } from 'zod';

// ============================================
// Environment Schema
// ============================================

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Notion API (optional in dev, required in production)
  NOTION_API_KEY: z.string().optional(),
  NOTION_DB_TASKS_ID: z.string().optional(),
  NOTION_DB_DAILYLOG_ID: z.string().optional(),
  NOTION_DB_AREAS_ID: z.string().optional(),
  NOTION_DB_PRINCIPLES_ID: z.string().optional(),

  // LLM Provider
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'local']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gpt-4o-mini'),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // LifeCoach API Base URL
  LIFECOACH_API_BASE_URL: z.string().url().default('http://localhost:3000'),
});

// ============================================
// Parse & Validate
// ============================================

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

const env = loadEnv();

// ============================================
// Config Object (structured)
// ============================================

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  notion: {
    apiKey: env.NOTION_API_KEY ?? '',
    dbTasksId: env.NOTION_DB_TASKS_ID ?? '',
    dbDailyLogId: env.NOTION_DB_DAILYLOG_ID ?? '',
    dbAreasId: env.NOTION_DB_AREAS_ID ?? '',
    dbPrinciplesId: env.NOTION_DB_PRINCIPLES_ID ?? '',
  },

  llm: {
    provider: env.LLM_PROVIDER,
    openaiApiKey: env.OPENAI_API_KEY ?? '',
    model: env.LLM_MODEL,
  },

  telegram: {
    botToken: env.TELEGRAM_BOT_TOKEN ?? '',
  },

  lifecoachApiBaseUrl: env.LIFECOACH_API_BASE_URL,
} as const;

// ============================================
// Type Export
// ============================================

export type Config = typeof config;

export default config;

