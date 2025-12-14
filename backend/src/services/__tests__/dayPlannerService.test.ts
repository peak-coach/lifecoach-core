/**
 * Unit-Tests für DayPlannerService
 * 
 * Testet die regelbasierte Tagesplan-Generierung gemäß docs/api-plan-day.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DayPlannerService } from '../dayPlannerService.js';
import type { PlanDayRequest, Task, TimeBlock } from '../../schemas/planDay.schema.js';

describe('DayPlannerService', () => {
  let service: DayPlannerService;

  beforeEach(() => {
    service = new DayPlannerService();
  });

  describe('generateDayPlan', () => {
    // ===================================================
    // Testfall 1: Keine Tasks -> Plan mit Routinen/Breaks
    // ===================================================
    describe('when no tasks are provided', () => {
      it('should return a plan with Morning Routine and Evening Review', async () => {
        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks: [],
        };

        const plan = await service.generateDayPlan(request);

        expect(plan).toBeDefined();
        expect(plan.date).toBe('2025-11-28');
        expect(plan.blocks).toBeInstanceOf(Array);
        expect(plan.blocks.length).toBeGreaterThanOrEqual(2);

        // Morning Routine sollte vorhanden sein
        const morningRoutine = plan.blocks.find(
          (b) => b.type === 'routine' && b.title === 'Morning Routine'
        );
        expect(morningRoutine).toBeDefined();
        expect(morningRoutine?.startTime).toBe('08:00');
        expect(morningRoutine?.endTime).toBe('09:00');

        // Evening Review sollte vorhanden sein
        const eveningReview = plan.blocks.find(
          (b) => b.type === 'routine' && b.title === 'Evening Review'
        );
        expect(eveningReview).toBeDefined();
        expect(eveningReview?.startTime).toBe('20:00');
        expect(eveningReview?.endTime).toBe('20:30');
      });

      it('should include a summary even without tasks', async () => {
        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks: [],
        };

        const plan = await service.generateDayPlan(request);

        expect(plan.summary).toBeDefined();
        expect(plan.summary).toContain('0 tasks scheduled');
      });

      it('should include createdAt timestamp in ISO format', async () => {
        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks: [],
        };

        const plan = await service.generateDayPlan(request);

        expect(plan.createdAt).toBeDefined();
        // ISO 8601 format validation
        expect(() => new Date(plan.createdAt)).not.toThrow();
        expect(new Date(plan.createdAt).toISOString()).toBe(plan.createdAt);
      });
    });

    // ===================================================
    // Testfall 2: Tasks mit unterschiedlicher Priority
    // ===================================================
    describe('when tasks with different priorities are provided', () => {
      it('should schedule tasks as focus blocks', async () => {
        const tasks: Task[] = [
          { id: 'task-1', title: 'High Priority Task', priority: 'high', estimatedMinutes: 60 },
          { id: 'task-2', title: 'Low Priority Task', priority: 'low', estimatedMinutes: 30 },
        ];

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        // Focus-Blöcke sollten die Tasks enthalten
        const focusBlocks = plan.blocks.filter((b) => b.type === 'focus');
        expect(focusBlocks.length).toBe(2);

        // Prüfe, dass Task-IDs korrekt verknüpft sind
        const task1Block = focusBlocks.find((b) => b.taskId === 'task-1');
        const task2Block = focusBlocks.find((b) => b.taskId === 'task-2');

        expect(task1Block).toBeDefined();
        expect(task1Block?.title).toBe('High Priority Task');
        expect(task2Block).toBeDefined();
        expect(task2Block?.title).toBe('Low Priority Task');
      });

      it('should prioritize high priority tasks earlier in the day', async () => {
        const tasks: Task[] = [
          { id: 'task-low', title: 'Low Priority', priority: 'low', estimatedMinutes: 30 },
          { id: 'task-high', title: 'High Priority', priority: 'high', estimatedMinutes: 30 },
          { id: 'task-medium', title: 'Medium Priority', priority: 'medium', estimatedMinutes: 30 },
        ];

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        const focusBlocks = plan.blocks.filter((b) => b.type === 'focus');
        
        // High priority sollte zuerst kommen (Index 0)
        expect(focusBlocks[0].taskId).toBe('task-high');
        // Medium priority als zweites
        expect(focusBlocks[1].taskId).toBe('task-medium');
        // Low priority zuletzt
        expect(focusBlocks[2].taskId).toBe('task-low');
      });

      it('should include high priority count in summary', async () => {
        const tasks: Task[] = [
          { id: 'task-1', title: 'High 1', priority: 'high', estimatedMinutes: 30 },
          { id: 'task-2', title: 'High 2', priority: 'high', estimatedMinutes: 30 },
          { id: 'task-3', title: 'Low', priority: 'low', estimatedMinutes: 30 },
        ];

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        expect(plan.summary).toContain('3 tasks scheduled');
        expect(plan.summary).toContain('2 high priority');
      });
    });

    // ===================================================
    // Testfall 3: Task ohne Priority -> Default-Behandlung
    // ===================================================
    describe('when task has no priority', () => {
      it('should treat missing priority as medium', async () => {
        const tasks: Task[] = [
          { id: 'task-no-prio', title: 'No Priority Task', estimatedMinutes: 30 },
          { id: 'task-low', title: 'Low Priority', priority: 'low', estimatedMinutes: 30 },
          { id: 'task-high', title: 'High Priority', priority: 'high', estimatedMinutes: 30 },
        ];

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        const focusBlocks = plan.blocks.filter((b) => b.type === 'focus');
        
        // High zuerst, dann No-Priority (wie medium), dann Low
        expect(focusBlocks[0].taskId).toBe('task-high');
        expect(focusBlocks[1].taskId).toBe('task-no-prio');
        expect(focusBlocks[2].taskId).toBe('task-low');
      });
    });

    // ===================================================
    // Testfall 4: Zeitblöcke haben korrekte Struktur
    // ===================================================
    describe('time block structure', () => {
      it('should generate blocks with valid IDs', async () => {
        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks: [{ id: 't1', title: 'Task 1', estimatedMinutes: 60 }],
        };

        const plan = await service.generateDayPlan(request);

        plan.blocks.forEach((block, index) => {
          expect(block.id).toBe(`block-${index}`);
        });
      });

      it('should generate blocks with valid time format HH:MM', async () => {
        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks: [{ id: 't1', title: 'Task 1', estimatedMinutes: 60 }],
        };

        const plan = await service.generateDayPlan(request);

        const timeRegex = /^\d{2}:\d{2}$/;
        plan.blocks.forEach((block) => {
          expect(block.startTime).toMatch(timeRegex);
          expect(block.endTime).toMatch(timeRegex);
        });
      });

      it('should set correct block types', async () => {
        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks: [
            { id: 't1', title: 'Task 1', estimatedMinutes: 120 },
            { id: 't2', title: 'Task 2', estimatedMinutes: 30 },
          ],
        };

        const plan = await service.generateDayPlan(request);

        const types = plan.blocks.map((b) => b.type);
        
        // Sollte routine, focus, break, focus, routine enthalten
        expect(types).toContain('routine');
        expect(types).toContain('focus');
      });
    });

    // ===================================================
    // Testfall 5: Pausen werden nach 2 Stunden Arbeit eingefügt
    // ===================================================
    describe('break scheduling', () => {
      it('should insert a break after 2 hours of work', async () => {
        // 2 Tasks à 60 Minuten = 120 Minuten -> danach Break
        const tasks: Task[] = [
          { id: 't1', title: 'Task 1', estimatedMinutes: 60 },
          { id: 't2', title: 'Task 2', estimatedMinutes: 60 },
          { id: 't3', title: 'Task 3', estimatedMinutes: 60 },
        ];

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        const breakBlocks = plan.blocks.filter((b) => b.type === 'break');
        
        // Nach 2 Stunden Arbeit sollte mindestens eine Pause eingefügt werden
        expect(breakBlocks.length).toBeGreaterThanOrEqual(1);
        expect(breakBlocks[0].title).toBe('Short Break');
      });

      it('should create 15-minute breaks', async () => {
        const tasks: Task[] = [
          { id: 't1', title: 'Task 1', estimatedMinutes: 120 },
          { id: 't2', title: 'Task 2', estimatedMinutes: 60 },
        ];

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        const breakBlocks = plan.blocks.filter((b) => b.type === 'break');
        
        breakBlocks.forEach((breakBlock) => {
          // Break sollte 15 Minuten dauern
          const startMinutes = parseInt(breakBlock.startTime.split(':')[0]) * 60 + 
                              parseInt(breakBlock.startTime.split(':')[1]);
          const endMinutes = parseInt(breakBlock.endTime.split(':')[0]) * 60 + 
                            parseInt(breakBlock.endTime.split(':')[1]);
          expect(endMinutes - startMinutes).toBe(15);
        });
      });
    });

    // ===================================================
    // Testfall 6: Default-Dauer für Tasks ohne estimatedMinutes
    // ===================================================
    describe('task duration defaults', () => {
      it('should use 60 minutes as default when estimatedMinutes is not provided', async () => {
        const tasks: Task[] = [
          { id: 't1', title: 'Task without estimate' },
        ];

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        const focusBlock = plan.blocks.find((b) => b.type === 'focus');
        expect(focusBlock).toBeDefined();
        
        // Start 09:00, Default 60 Min -> End 10:00
        expect(focusBlock?.startTime).toBe('09:00');
        expect(focusBlock?.endTime).toBe('10:00');
      });
    });

    // ===================================================
    // Testfall 7: Plan respektiert Arbeitstag-Grenzen
    // ===================================================
    describe('workday boundaries', () => {
      it('should not schedule tasks ending after 18:00', async () => {
        // Viele lange Tasks -> sollten nicht alle geplant werden
        const tasks: Task[] = Array.from({ length: 20 }, (_, i) => ({
          id: `task-${i}`,
          title: `Long Task ${i}`,
          estimatedMinutes: 60,
        }));

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        const focusBlocks = plan.blocks.filter((b) => b.type === 'focus');
        
        // Prüfe, dass kein Focus-Block nach 18:00 endet
        focusBlocks.forEach((block) => {
          const hours = parseInt(block.endTime.split(':')[0]);
          const minutes = parseInt(block.endTime.split(':')[1]);
          const totalMinutes = hours * 60 + minutes;
          // Blocks sollten bis spätestens 18:00 (1080 Minuten) enden
          expect(totalMinutes).toBeLessThanOrEqual(18 * 60);
        });
        
        // Es sollten nicht alle 20 Tasks geplant worden sein
        expect(focusBlocks.length).toBeLessThan(20);
      });

      it('should start tasks after morning routine at 09:00', async () => {
        const tasks: Task[] = [
          { id: 't1', title: 'First Task', estimatedMinutes: 30 },
        ];

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        const firstFocus = plan.blocks.find((b) => b.type === 'focus');
        expect(firstFocus?.startTime).toBe('09:00');
      });
    });

    // ===================================================
    // Testfall 8: Summary berechnet Gesamtstunden korrekt
    // ===================================================
    describe('summary calculation', () => {
      it('should calculate total work hours correctly', async () => {
        const tasks: Task[] = [
          { id: 't1', title: 'Task 1', estimatedMinutes: 60 },  // 1h
          { id: 't2', title: 'Task 2', estimatedMinutes: 90 },  // 1.5h
          { id: 't3', title: 'Task 3', estimatedMinutes: 30 },  // 0.5h
        ];
        // Total: 3h

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        expect(plan.summary).toContain('3h work');
      });

      it('should show singular "task" for one task', async () => {
        const tasks: Task[] = [
          { id: 't1', title: 'Single Task', estimatedMinutes: 60 },
        ];

        const request: PlanDayRequest = {
          date: '2025-11-28',
          tasks,
        };

        const plan = await service.generateDayPlan(request);

        expect(plan.summary).toContain('1 task scheduled');
      });
    });
  });
});

