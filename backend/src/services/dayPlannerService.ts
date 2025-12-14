/**
 * DayPlannerService
 * 
 * Verantwortlich für die Generierung von Tagesplänen basierend auf Tasks.
 * Gemäß Design-Prinzip "Agenten als Services" (docs/design-principles.md)
 * 
 * Phase 1: Regelbasierte Planung
 * Phase 2+: LLM-Integration für intelligentere Planung
 */

import type { PlanDayRequest, DayPlan, TimeBlock, Task } from '../schemas/planDay.schema.js';
import logger from '../lib/logger.js';

export class DayPlannerService {
  /**
   * Generiert einen Tagesplan aus der Request-Payload.
   * Entspricht der Spezifikation in docs/api-plan-day.md
   */
  async generateDayPlan(request: PlanDayRequest): Promise<DayPlan> {
    const { date, tasks } = request;
    
    logger.info({ date, taskCount: tasks.length }, 'Generating day plan');

    const blocks = this.buildTimeBlocks(tasks);
    const summary = this.buildSummary(date, tasks);

    const plan: DayPlan = {
      date,
      blocks,
      summary,
      createdAt: new Date().toISOString(),
    };

    logger.debug({ blockCount: blocks.length }, 'Day plan generated successfully');
    return plan;
  }

  /**
   * Baut die Zeitblöcke für den Tag.
   * Regelbasierte Logik:
   * - Morning Routine: 08:00-09:00
   * - Focus-Blöcke für Tasks: ab 09:00
   * - Pausen nach je 2 Stunden Arbeit
   * - Evening Review: 20:00-20:30
   */
  private buildTimeBlocks(tasks: Task[]): TimeBlock[] {
    const blocks: TimeBlock[] = [];
    let blockIndex = 0;

    // Morning Routine
    blocks.push({
      id: `block-${blockIndex++}`,
      startTime: '08:00',
      endTime: '09:00',
      type: 'routine',
      title: 'Morning Routine',
      description: 'Start the day with intention',
    });

    // Sortiere Tasks nach Priorität (high > medium > low)
    const sortedTasks = this.sortTasksByPriority(tasks);
    
    let currentMinutes = 9 * 60; // Start um 09:00 (in Minuten seit Mitternacht)
    const endOfWorkday = 18 * 60; // Ende um 18:00
    let workMinutesSinceBreak = 0;

    for (const task of sortedTasks) {
      // Prüfe ob noch Zeit im Arbeitstag ist
      if (currentMinutes >= endOfWorkday) {
        logger.warn({ taskId: task.id }, 'Task could not be scheduled - no time left');
        break;
      }

      // Pause nach 2 Stunden (120 Minuten) Arbeit
      if (workMinutesSinceBreak >= 120) {
        const breakStart = this.minutesToTime(currentMinutes);
        currentMinutes += 15;
        const breakEnd = this.minutesToTime(currentMinutes);

        blocks.push({
          id: `block-${blockIndex++}`,
          startTime: breakStart,
          endTime: breakEnd,
          type: 'break',
          title: 'Short Break',
          description: 'Rest and recharge',
        });

        workMinutesSinceBreak = 0;
      }

      // Task-Block
      const duration = task.estimatedMinutes ?? 60; // Default: 60 Minuten
      const startTime = this.minutesToTime(currentMinutes);
      currentMinutes += duration;
      const endTime = this.minutesToTime(Math.min(currentMinutes, endOfWorkday));

      blocks.push({
        id: `block-${blockIndex++}`,
        startTime,
        endTime,
        type: 'focus',
        taskId: task.id,
        title: task.title,
        description: task.description,
      });

      workMinutesSinceBreak += duration;
    }

    // Evening Review
    blocks.push({
      id: `block-${blockIndex++}`,
      startTime: '20:00',
      endTime: '20:30',
      type: 'routine',
      title: 'Evening Review',
      description: 'Reflect on the day and prepare for tomorrow',
    });

    return blocks;
  }

  /**
   * Sortiert Tasks nach Priorität (high zuerst)
   */
  private sortTasksByPriority(tasks: Task[]): Task[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    return [...tasks].sort((a, b) => {
      const priorityA = a.priority ? priorityOrder[a.priority] : 1;
      const priorityB = b.priority ? priorityOrder[b.priority] : 1;
      return priorityA - priorityB;
    });
  }

  /**
   * Konvertiert Minuten seit Mitternacht in HH:MM Format
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Baut die Zusammenfassung für den Tagesplan
   */
  private buildSummary(date: string, tasks: Task[]): string {
    const taskCount = tasks.length;
    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;
    const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 60), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    let summary = `Day plan for ${date}: ${taskCount} task${taskCount !== 1 ? 's' : ''} scheduled`;
    
    if (highPriorityCount > 0) {
      summary += `, ${highPriorityCount} high priority`;
    }
    
    summary += ` (~${totalHours}h work). `;
    summary += 'Focus on completing your most important work during morning hours.';

    return summary;
  }
}

// Singleton-Export
export const dayPlannerService = new DayPlannerService();
export default dayPlannerService;
