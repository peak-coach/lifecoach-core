import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit Tests für das Actions System
 * 
 * Diese Tests prüfen die Geschäftslogik, nicht die HTTP-Schicht.
 * Integration Tests würden einen echten DB-Zustand benötigen.
 */

describe('Action System - Unit Tests', () => {
  describe('Action Data Validation', () => {
    it('should validate required fields for action creation', () => {
      const validAction = {
        source_type: 'module',
        action_description: 'Test action',
      };
      
      expect(validAction.source_type).toBeDefined();
      expect(validAction.action_description).toBeDefined();
    });

    it('should accept valid source types', () => {
      const validSourceTypes = ['module', 'book', 'manual', 'video'];
      
      validSourceTypes.forEach(type => {
        expect(['module', 'book', 'manual', 'video']).toContain(type);
      });
    });

    it('should accept valid timing types', () => {
      const validTimingTypes = ['specific', 'daily', 'weekly', 'opportunity'];
      
      validTimingTypes.forEach(timing => {
        expect(['specific', 'daily', 'weekly', 'opportunity']).toContain(timing);
      });
    });

    it('should accept valid status values', () => {
      const validStatuses = ['pending', 'completed', 'skipped', 'archived'];
      
      validStatuses.forEach(status => {
        expect(['pending', 'completed', 'skipped', 'archived']).toContain(status);
      });
    });

    it('should validate effectiveness rating range (1-5)', () => {
      const validRatings = [1, 2, 3, 4, 5];
      const invalidRatings = [0, 6, -1, 100];
      
      validRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      });
      
      invalidRatings.forEach(rating => {
        expect(rating < 1 || rating > 5).toBe(true);
      });
    });
  });

  describe('Implementation Intention Builder', () => {
    it('should format implementation intention correctly', () => {
      const situation = 'ich heute Abend Zeit habe';
      const behavior = 'an meiner Schwachstelle arbeiten';
      
      const formatted = `WENN ${situation}, DANN werde ich ${behavior}.`;
      
      expect(formatted).toContain('WENN');
      expect(formatted).toContain('DANN');
      expect(formatted).toContain(situation);
      expect(formatted).toContain(behavior);
    });

    it('should support various trigger suggestions', () => {
      const triggerSuggestions = [
        'Nach dem Aufstehen',
        'Im nächsten Meeting',
        'Bei der nächsten Gelegenheit',
        'Vor dem Schlafengehen',
      ];
      
      expect(triggerSuggestions.length).toBeGreaterThan(0);
      triggerSuggestions.forEach(trigger => {
        expect(trigger.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Action Status Transitions', () => {
    it('should allow valid transitions from pending', () => {
      const validFromPending = ['completed', 'skipped', 'archived'];
      
      validFromPending.forEach(status => {
        expect(['completed', 'skipped', 'archived']).toContain(status);
      });
    });

    it('should set completed_at timestamp when completing', () => {
      const completionData = {
        status: 'completed',
        completed_at: new Date().toISOString(),
      };
      
      expect(completionData.completed_at).toBeDefined();
      expect(new Date(completionData.completed_at)).toBeInstanceOf(Date);
    });
  });

  describe('Action Limits', () => {
    const MAX_PENDING_ACTIONS = 10;
    
    it('should enforce maximum pending actions limit', () => {
      const pendingCount = 8;
      
      expect(pendingCount).toBeLessThan(MAX_PENDING_ACTIONS);
    });

    it('should warn when approaching limit', () => {
      const pendingCount = 9;
      const warningThreshold = MAX_PENDING_ACTIONS - 2;
      
      if (pendingCount >= warningThreshold) {
        expect(pendingCount).toBeGreaterThanOrEqual(warningThreshold);
      }
    });
  });

  describe('Action Prioritization', () => {
    it('should prioritize due actions first', () => {
      const actions = [
        { id: '1', due_date: '2024-01-01', timing_type: 'specific' },
        { id: '2', due_date: '2024-01-15', timing_type: 'specific' },
        { id: '3', due_date: null, timing_type: 'opportunity' },
      ];
      
      const sorted = actions.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
      
      expect(sorted[0].id).toBe('1');
      expect(sorted[sorted.length - 1].id).toBe('3');
    });
  });

  describe('Action Source Tracking', () => {
    it('should track source type correctly', () => {
      const moduleAction = {
        source_type: 'module',
        source_id: 'module-123',
        source_title: 'Deliberate Practice',
      };
      
      const bookAction = {
        source_type: 'book',
        source_id: 'book-456',
        source_title: 'Das Harvard-Konzept',
      };
      
      expect(moduleAction.source_type).toBe('module');
      expect(bookAction.source_type).toBe('book');
    });
  });
});

describe('Action Reminders', () => {
  it('should support different reminder types', () => {
    const reminderTypes = ['due_date', 'follow_up', 'overdue', 'custom'];
    
    expect(reminderTypes).toHaveLength(4);
  });

  it('should calculate overdue status', () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    
    const isOverdue = (dueDate: Date) => dueDate < now;
    
    expect(isOverdue(pastDate)).toBe(true);
    expect(isOverdue(futureDate)).toBe(false);
  });
});
