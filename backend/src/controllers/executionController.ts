/**
 * Execution Controller
 * 
 * Handler für Execution-Tracking-Endpunkte gemäß docs/api-execution-event.md
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { ExecutionEventRequestSchema, type ExecutionEventResponse } from '../schemas/executionEvent.schema.js';
import { executionService } from '../services/executionService.js';
import { validate } from '../lib/validation.js';
import { InternalError } from '../lib/errors.js';
import logger from '../lib/logger.js';

/**
 * POST /execution/event
 * 
 * Erfasst ein Execution-Event für einen Tagesplan-Block.
 * Wird im LC-WF3 (Execution Tracking) von n8n verwendet.
 */
export async function processExecutionEvent(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Validierung mit Zod
  const validatedRequest = validate(ExecutionEventRequestSchema, request.body);
  
  logger.info(
    { date: validatedRequest.date, blockId: validatedRequest.blockId, action: validatedRequest.action },
    'POST /execution/event - Processing execution event'
  );

  try {
    const response: ExecutionEventResponse = await executionService.processEvent(validatedRequest);
    reply.status(200).send(response);
  } catch (err) {
    logger.error({ err }, 'Failed to process execution event');
    throw new InternalError('Failed to process execution event');
  }
}

