/**
 * Execution Routes
 * 
 * Routing für Execution-Tracking-Endpunkte gemäß docs/api-execution-event.md
 */

import type { FastifyInstance } from 'fastify';
import { processExecutionEvent } from '../controllers/executionController.js';

export async function executionRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /execution/event
   * 
   * Erfasst ein Execution-Event für einen Block.
   * Gemäß Spezifikation in docs/api-execution-event.md
   */
  fastify.post('/execution/event', {
    schema: {
      description: 'Process an execution event for a day plan block',
      tags: ['Execution'],
      body: {
        type: 'object',
        required: ['date', 'blockId', 'action'],
        properties: {
          date: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Date in YYYY-MM-DD format',
          },
          blockId: {
            type: 'string',
            description: 'Block ID from day plan (e.g., block-0)',
          },
          action: {
            type: 'string',
            enum: ['started', 'completed', 'skipped', 'paused'],
            description: 'Type of execution action',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'ISO-8601 timestamp of the event',
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the event',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            event: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                blockId: { type: 'string' },
                action: { type: 'string' },
                processedAt: { type: 'string', format: 'date-time' },
              },
            },
            nextSuggestedAction: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        422: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'array' },
          },
        },
      },
    },
    handler: processExecutionEvent,
  });
}

export default executionRoutes;

