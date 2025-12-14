/**
 * Health Routes
 * 
 * System-Endpunkte für Health Checks
 */

import type { FastifyInstance } from 'fastify';
import { healthCheck } from '../controllers/healthController.js';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /health
   * Health Check für Container-Orchestrierung und Monitoring
   */
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            uptime: { type: 'number', description: 'Uptime in seconds' },
          },
        },
      },
    },
    handler: healthCheck,
  });
}

export default healthRoutes;
