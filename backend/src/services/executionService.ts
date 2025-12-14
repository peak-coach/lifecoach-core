/**
 * ExecutionService
 * 
 * Verantwortlich für das Tracking von Execution-Events (LC-WF3).
 * Gemäß Design-Prinzip "Agenten als Services" (docs/design-principles.md)
 * 
 * Phase 1: Logging + Echo-Response
 * Phase 2+: Integration mit Notion, intelligente Vorschläge
 */

import type { ExecutionEventRequest, ExecutionEventResponse } from '../schemas/executionEvent.schema.js';
import logger from '../lib/logger.js';

export class ExecutionService {
  /**
   * Verarbeitet ein Execution-Event für einen Block.
   * Gemäß Spezifikation in docs/api-execution-event.md
   */
  async processEvent(request: ExecutionEventRequest): Promise<ExecutionEventResponse> {
    const { date, blockId, action, timestamp, notes } = request;
    const processedAt = new Date().toISOString();

    logger.info(
      { date, blockId, action, timestamp, notes },
      `Execution event: ${action} for block ${blockId}`
    );

    // Generiere Vorschlag basierend auf Action
    const nextSuggestedAction = this.suggestNextAction(action);

    const response: ExecutionEventResponse = {
      success: true,
      event: {
        date,
        blockId,
        action,
        processedAt,
      },
      ...(nextSuggestedAction && { nextSuggestedAction }),
    };

    logger.debug({ response }, 'Execution event processed');
    return response;
  }

  /**
   * Generiert einen Vorschlag für die nächste Aktion.
   * Später: LLM-basierte intelligentere Vorschläge.
   */
  private suggestNextAction(action: string): string | undefined {
    switch (action) {
      case 'completed':
        return 'Great job! Take a short break before your next focus block.';
      case 'started':
        return 'Focus mode activated. You got this!';
      case 'skipped':
        return 'No worries. Consider rescheduling this task for tomorrow.';
      case 'paused':
        return 'Take your time. Resume when you\'re ready.';
      default:
        return undefined;
    }
  }
}

// Singleton-Export
export const executionService = new ExecutionService();
export default executionService;

