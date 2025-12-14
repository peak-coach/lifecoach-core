/**
 * ReviewService
 * 
 * Verantwortlich für das Generieren von Tages-Reviews (LC-WF4).
 * Gemäß Design-Prinzip "Agenten als Services" (docs/design-principles.md)
 * 
 * Phase 1: Hardcoded Summary + Beispiel-Fragen
 * Phase 2+: LLM-basierte personalisierte Reviews
 */

import type { ReviewDayRequest, ReviewDayResponse, ReviewQuestion } from '../schemas/reviewDay.schema.js';
import logger from '../lib/logger.js';

export class ReviewService {
  /**
   * Generiert einen Tages-Review mit Summary und Reflexionsfragen.
   * Gemäß Spezifikation in docs/api-review-day.md
   */
  async generateReview(request: ReviewDayRequest): Promise<ReviewDayResponse> {
    const { date, daySummary, completedTaskIds, skippedTaskIds, mood, energy } = request;

    logger.info(
      { date, completedTasks: completedTaskIds?.length, skippedTasks: skippedTaskIds?.length },
      'Generating day review'
    );

    const summary = this.buildSummary(request);
    const questions = this.buildQuestions(request);
    const insights = this.generateInsights(request);

    const response: ReviewDayResponse = {
      success: true,
      summary,
      questions,
      ...(insights.length > 0 && { insights }),
      createdAt: new Date().toISOString(),
    };

    logger.debug({ questionCount: questions.length }, 'Review generated');
    return response;
  }

  /**
   * Baut die Zusammenfassung des Tages.
   */
  private buildSummary(request: ReviewDayRequest): string {
    const { date, daySummary, completedTaskIds, skippedTaskIds, mood, energy } = request;
    const parts: string[] = [];

    // Block-Statistik
    if (daySummary) {
      const { plannedBlocks = 0, completedBlocks = 0, skippedBlocks = 0 } = daySummary;
      const percentage = plannedBlocks > 0 
        ? Math.round((completedBlocks / plannedBlocks) * 100) 
        : 0;
      parts.push(`Today you completed ${completedBlocks} out of ${plannedBlocks} planned blocks (${percentage}%).`);
      
      if (skippedBlocks > 0) {
        parts.push(`${skippedBlocks} block${skippedBlocks > 1 ? 's were' : ' was'} skipped.`);
      }
    }

    // Task-Statistik
    const completedCount = completedTaskIds?.length ?? 0;
    const skippedCount = skippedTaskIds?.length ?? 0;
    if (completedCount > 0 || skippedCount > 0) {
      parts.push(`You finished ${completedCount} task${completedCount !== 1 ? 's' : ''}${skippedCount > 0 ? ` and skipped ${skippedCount}` : ''}.`);
    }

    // Mood & Energy
    if (mood !== undefined && energy !== undefined) {
      const moodLabel = mood >= 7 ? 'good' : mood >= 4 ? 'moderate' : 'low';
      const energyLabel = energy >= 7 ? 'high' : energy >= 4 ? 'moderate' : 'low';
      parts.push(`Your mood was ${moodLabel} (${mood}/10) with ${energyLabel} energy (${energy}/10).`);
    }

    // Fallback wenn keine Daten
    if (parts.length === 0) {
      parts.push(`Review for ${date}. How did your day go?`);
    }

    return parts.join(' ');
  }

  /**
   * Generiert Reflexionsfragen basierend auf dem Tag.
   */
  private buildQuestions(request: ReviewDayRequest): ReviewQuestion[] {
    const { daySummary, mood, energy } = request;
    const questions: ReviewQuestion[] = [];

    // Basis-Fragen (immer dabei)
    questions.push({
      id: 'q1',
      question: 'What was your biggest win today?',
      type: 'text',
    });

    questions.push({
      id: 'q2',
      question: 'What would you do differently tomorrow?',
      type: 'text',
    });

    // Kontextabhängige Fragen
    if (daySummary && daySummary.skippedBlocks && daySummary.skippedBlocks > 0) {
      questions.push({
        id: 'q3',
        question: 'What prevented you from completing all planned blocks?',
        type: 'text',
      });
    } else if (mood !== undefined && mood < 5) {
      questions.push({
        id: 'q3',
        question: 'What could help improve your mood tomorrow?',
        type: 'text',
      });
    } else if (energy !== undefined && energy < 5) {
      questions.push({
        id: 'q3',
        question: 'What drained your energy today? How can you prevent it?',
        type: 'text',
      });
    } else {
      questions.push({
        id: 'q3',
        question: 'How satisfied are you with today\'s progress?',
        type: 'scale',
        options: ['1', '2', '3', '4', '5'],
      });
    }

    return questions;
  }

  /**
   * Generiert optionale Insights basierend auf den Daten.
   * Später: ML/LLM-basierte Muster-Erkennung.
   */
  private generateInsights(request: ReviewDayRequest): string[] {
    const insights: string[] = [];
    const { daySummary, mood, energy } = request;

    if (daySummary) {
      const { plannedBlocks = 0, completedBlocks = 0 } = daySummary;
      const completionRate = plannedBlocks > 0 ? completedBlocks / plannedBlocks : 0;

      if (completionRate >= 0.8) {
        insights.push('Great completion rate! You\'re on track with your goals.');
      } else if (completionRate < 0.5) {
        insights.push('Consider planning fewer, more focused blocks tomorrow.');
      }
    }

    if (energy !== undefined && energy < 5) {
      insights.push('Low energy detected. Ensure you get enough rest tonight.');
    }

    if (mood !== undefined && mood >= 8) {
      insights.push('Your positive mood is a great foundation for productivity.');
    }

    return insights;
  }
}

// Singleton-Export
export const reviewService = new ReviewService();
export default reviewService;

