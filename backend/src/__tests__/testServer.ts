/**
 * Test Server Builder
 * 
 * Erstellt eine Fastify-Instanz für Integration-Tests ohne Server-Start.
 */

import Fastify, { FastifyInstance } from 'fastify';
import registerRoutes from '../routes/index.js';
import { errorHandler } from '../lib/errors.js';

/**
 * Baut einen Fastify-Server für Tests.
 * Der Server wird nicht gestartet (kein listen), nur konfiguriert.
 */
export async function buildTestServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false, // Logging in Tests deaktivieren
  });

  // Global Error Handler
  fastify.setErrorHandler(errorHandler);

  // Routes registrieren
  await registerRoutes(fastify);

  return fastify;
}

/**
 * Helper zum Erstellen von Test-Requests
 */
export const testHelpers = {
  /**
   * Erstellt einen gültigen PlanDayRequest
   */
  createPlanDayRequest(overrides?: {
    date?: string;
    tasks?: Array<{
      id: string;
      title: string;
      priority?: 'high' | 'medium' | 'low';
      estimatedMinutes?: number;
      description?: string;
    }>;
  }) {
    return {
      date: overrides?.date ?? '2025-11-28',
      tasks: overrides?.tasks ?? [
        {
          id: 'task-1',
          title: 'Test Task 1',
          priority: 'high' as const,
          estimatedMinutes: 60,
        },
        {
          id: 'task-2',
          title: 'Test Task 2',
          priority: 'medium' as const,
          estimatedMinutes: 45,
        },
      ],
    };
  },

  /**
   * Erstellt einen leeren PlanDayRequest (keine Tasks)
   */
  createEmptyPlanDayRequest(date = '2025-11-28') {
    return {
      date,
      tasks: [],
    };
  },
};


