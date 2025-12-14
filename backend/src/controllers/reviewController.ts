/**
 * Review Controller
 * 
 * Handler für Review-Endpunkte gemäß docs/api-review-day.md
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { ReviewDayRequestSchema, type ReviewDayResponse } from '../schemas/reviewDay.schema.js';
import { reviewService } from '../services/reviewService.js';
import { validate } from '../lib/validation.js';
import { InternalError } from '../lib/errors.js';
import logger from '../lib/logger.js';

/**
 * POST /review/day
 * 
 * Generiert einen Tages-Review mit Summary und Reflexionsfragen.
 * Wird im LC-WF4 (Evening Review) von n8n verwendet.
 */
export async function createDayReview(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Validierung mit Zod
  const validatedRequest = validate(ReviewDayRequestSchema, request.body);
  
  logger.info(
    { date: validatedRequest.date },
    'POST /review/day - Creating day review'
  );

  try {
    const response: ReviewDayResponse = await reviewService.generateReview(validatedRequest);
    reply.status(200).send(response);
  } catch (err) {
    logger.error({ err }, 'Failed to generate day review');
    throw new InternalError('Failed to generate day review');
  }
}

