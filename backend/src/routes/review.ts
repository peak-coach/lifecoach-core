/**
 * Review Routes
 * 
 * Routing für Review-Endpunkte gemäß docs/api-review-day.md
 */

import type { FastifyInstance } from 'fastify';
import { createDayReview } from '../controllers/reviewController.js';

export async function reviewRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /review/day
   * 
   * Generiert einen Tages-Review mit Summary und Fragen.
   * Gemäß Spezifikation in docs/api-review-day.md
   */
  fastify.post('/review/day', {
    schema: {
      description: 'Generate a day review with summary and reflection questions',
      tags: ['Review'],
      body: {
        type: 'object',
        required: ['date'],
        properties: {
          date: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Date in YYYY-MM-DD format',
          },
          daySummary: {
            type: 'object',
            properties: {
              plannedBlocks: { type: 'number' },
              completedBlocks: { type: 'number' },
              skippedBlocks: { type: 'number' },
            },
          },
          completedTaskIds: {
            type: 'array',
            items: { type: 'string' },
          },
          skippedTaskIds: {
            type: 'array',
            items: { type: 'string' },
          },
          mood: {
            type: 'number',
            minimum: 1,
            maximum: 10,
          },
          energy: {
            type: 'number',
            minimum: 1,
            maximum: 10,
          },
          notes: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            summary: { type: 'string' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  question: { type: 'string' },
                  type: { type: 'string', enum: ['text', 'scale', 'choice'] },
                  options: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            insights: {
              type: 'array',
              items: { type: 'string' },
            },
            createdAt: { type: 'string', format: 'date-time' },
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
    handler: createDayReview,
  });
}

export default reviewRoutes;

