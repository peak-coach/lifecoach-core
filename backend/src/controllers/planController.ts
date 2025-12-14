/**
 * Plan Controller
 * 
 * Handler für Planning-Endpunkte gemäß docs/api-plan-day.md
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { PlanDayRequestSchema, type PlanDayResponse } from '../schemas/planDay.schema.js';
import { dayPlannerService } from '../services/dayPlannerService.js';
import { validate } from '../lib/validation.js';
import { InternalError } from '../lib/errors.js';
import logger from '../lib/logger.js';

/**
 * POST /plan/day
 * 
 * Erzeugt einen strukturierten Tagesplan für ein bestimmtes Datum.
 * Wird hauptsächlich im Morning-Workflow (LC-WF2) von n8n verwendet.
 */
export async function createDayPlan(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Validierung mit Zod
  const validatedRequest = validate(PlanDayRequestSchema, request.body);
  
  logger.info(
    { date: validatedRequest.date, taskCount: validatedRequest.tasks.length },
    'POST /plan/day - Creating day plan'
  );

  try {
    const plan = await dayPlannerService.generateDayPlan(validatedRequest);

    const response: PlanDayResponse = {
      success: true,
      plan,
    };

    reply.status(200).send(response);
  } catch (err) {
    logger.error({ err }, 'Failed to generate day plan');
    throw new InternalError('Failed to generate day plan');
  }
}
