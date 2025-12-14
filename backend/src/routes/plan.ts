/**
 * Plan Routes
 * 
 * Routing für Planning-Endpunkte gemäß docs/api-plan-day.md
 */

import type { FastifyInstance } from 'fastify';
import { createDayPlan } from '../controllers/planController.js';

export async function planRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /plan/day
   * 
   * Erzeugt einen strukturierten Tagesplan für ein bestimmtes Datum.
   * Gemäß Spezifikation in docs/api-plan-day.md
   */
  fastify.post('/plan/day', {
    schema: {
      description: 'Generate a day plan from tasks',
      tags: ['Planning'],
      body: {
        type: 'object',
        required: ['date', 'tasks'],
        properties: {
          date: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Date in YYYY-MM-DD format',
          },
          tasks: {
            type: 'array',
            description: 'List of tasks to schedule',
            items: {
              type: 'object',
              required: ['id', 'title'],
              properties: {
                id: { type: 'string', description: 'Task ID (e.g., Notion page ID)' },
                title: { type: 'string', description: 'Task title' },
                description: { type: 'string', description: 'Task description' },
                priority: { 
                  type: 'string', 
                  enum: ['high', 'medium', 'low'],
                  description: 'Task priority' 
                },
                estimatedMinutes: { 
                  type: 'number',
                  description: 'Estimated duration in minutes' 
                },
                area: { type: 'string', description: 'Life area (e.g., Work, Health)' },
                dueDate: { type: 'string', description: 'Due date' },
                status: { 
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed', 'skipped'],
                  description: 'Current task status'
                },
              },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            plan: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                blocks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      startTime: { type: 'string' },
                      endTime: { type: 'string' },
                      type: { type: 'string', enum: ['focus', 'break', 'meeting', 'routine', 'buffer'] },
                      taskId: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                    },
                  },
                },
                summary: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
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
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        500: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: createDayPlan,
  });
}

export default planRoutes;
