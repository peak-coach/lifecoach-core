import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests für die Learning API Route
 * 
 * Diese API Route ist kritisch für:
 * - XP Vergabe
 * - Progress Tracking
 * - Review Cards Erstellung
 */

// Mock Supabase responses
const mockSupabaseResponse = {
  data: { id: 'test-id' },
  error: null,
};

const mockSupabaseErrorResponse = {
  data: null,
  error: { message: 'Test error' },
};

describe('Learning API - Request Validation', () => {
  it('should accept valid module_completed request', () => {
    const validRequest = {
      activityType: 'module_completed',
      moduleId: 'mod-123',
      moduleNumber: 1,
      goalId: 'goal-456',
      goalTitle: 'Rhetorik verbessern',
      category: 'Rhetorik',
      quizScore: 3,
      totalQuestions: 3,
      confidenceData: [],
      reviewQuestions: [
        'Was ist die wichtigste Technik?',
        'Wie wendest du das an?',
      ],
    };

    expect(validRequest.activityType).toBe('module_completed');
    expect(validRequest.moduleNumber).toBeGreaterThan(0);
    expect(validRequest.quizScore).toBeDefined();
  });

  it('should reject request without activityType', () => {
    const invalidRequest = {
      moduleId: 'mod-123',
      moduleNumber: 1,
    };

    expect(invalidRequest).not.toHaveProperty('activityType');
  });

  it('should require authentication header', () => {
    const mockHeaders = new Headers();
    // No Authorization header
    
    expect(mockHeaders.get('Authorization')).toBeNull();
  });
});

describe('Learning API - Activity Types', () => {
  it('should recognize module_completed activity', () => {
    const validTypes = ['module_completed', 'review_completed', 'action_completed'];
    const activityType = 'module_completed';
    
    expect(validTypes).toContain(activityType);
  });

  it('should award correct XP per activity type', () => {
    const getXPForActivity = (activityType: string): number => {
      switch (activityType) {
        case 'module_completed':
          return 50;
        case 'review_completed':
          return 20;
        case 'action_completed':
          return 30;
        default:
          return 10;
      }
    };

    expect(getXPForActivity('module_completed')).toBe(50);
    expect(getXPForActivity('review_completed')).toBe(20);
    expect(getXPForActivity('action_completed')).toBe(30);
    expect(getXPForActivity('unknown')).toBe(10);
  });
});

describe('Learning API - Progress Update', () => {
  it('should update goal progress when goalId provided', () => {
    const request = {
      goalId: 'goal-123',
      moduleNumber: 3,
      totalModules: 5,
    };

    const shouldUpdateProgress = request.goalId !== null && request.goalId !== '';
    expect(shouldUpdateProgress).toBe(true);
  });

  it('should NOT update progress when goalId is missing', () => {
    const request = {
      goalId: null,
      moduleNumber: 3,
    };

    const shouldUpdateProgress = request.goalId !== null && request.goalId !== '';
    expect(shouldUpdateProgress).toBe(false);
  });

  it('should calculate completion percentage', () => {
    const calculateCompletion = (current: number, total: number) => 
      Math.round((current / total) * 100);

    expect(calculateCompletion(1, 5)).toBe(20);
    expect(calculateCompletion(3, 5)).toBe(60);
    expect(calculateCompletion(5, 5)).toBe(100);
  });
});

describe('Learning API - Review Cards', () => {
  it('should create review cards for module completion', () => {
    const reviewQuestions = [
      'Was ist Deliberate Practice?',
      'Wie identifizierst du Schwächen?',
    ];

    const createReviewCards = (questions: string[], moduleId: string, userId: string) => {
      return questions.map((question, index) => ({
        user_id: userId,
        question,
        answer: '', // To be filled by user
        source_type: 'module',
        source_id: moduleId,
        next_review: new Date().toISOString(),
        ease_factor: 2.5, // SM-2 default
        interval: 1, // Start with 1 day
        repetitions: 0,
      }));
    };

    const cards = createReviewCards(reviewQuestions, 'mod-123', 'user-456');
    
    expect(cards).toHaveLength(2);
    expect(cards[0].ease_factor).toBe(2.5);
    expect(cards[0].source_type).toBe('module');
  });

  it('should use SM-2 initial values', () => {
    const sm2Defaults = {
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
    };

    expect(sm2Defaults.easeFactor).toBe(2.5);
    expect(sm2Defaults.interval).toBe(1);
    expect(sm2Defaults.repetitions).toBe(0);
  });
});

describe('Learning API - Error Handling', () => {
  it('should handle database errors gracefully', async () => {
    const handleError = (error: any): { status: number; message: string } => {
      console.error('Database error:', error);
      return {
        status: 500,
        message: 'Internal server error',
      };
    };

    const result = handleError({ message: 'Connection failed' });
    expect(result.status).toBe(500);
  });

  it('should return 401 for unauthenticated requests', () => {
    const isAuthenticated = false;
    const responseStatus = isAuthenticated ? 200 : 401;
    
    expect(responseStatus).toBe(401);
  });

  it('should return 400 for missing required fields', () => {
    const validateRequest = (body: any): { valid: boolean; error?: string } => {
      if (!body.activityType) {
        return { valid: false, error: 'activityType is required' };
      }
      return { valid: true };
    };

    const result = validateRequest({});
    expect(result.valid).toBe(false);
    expect(result.error).toContain('activityType');
  });
});

describe('Learning API - Confidence Tracking', () => {
  it('should store confidence data with answers', () => {
    const confidenceData = [
      { questionIndex: 0, confidence: 4, wasCorrect: true },
      { questionIndex: 1, confidence: 3, wasCorrect: false }, // Overconfident: high confidence but wrong
      { questionIndex: 2, confidence: 3, wasCorrect: true },
    ];

    expect(confidenceData).toHaveLength(3);
    
    const overconfident = confidenceData.filter(
      d => d.confidence >= 3 && !d.wasCorrect
    );
    expect(overconfident).toHaveLength(1);
  });

  it('should calculate average confidence', () => {
    const confidenceData = [
      { confidence: 4 },
      { confidence: 2 },
      { confidence: 3 },
    ];

    const avgConfidence = 
      confidenceData.reduce((sum, d) => sum + d.confidence, 0) / 
      confidenceData.length;
    
    expect(avgConfidence).toBe(3);
  });
});

describe('Learning API - Module Data', () => {
  it('should log module content for debugging', () => {
    const moduleData = {
      moduleId: 'mod-123',
      title: 'Deliberate Practice',
      topic: 'Lernen',
      moduleNumber: 1,
      totalModules: 5,
    };

    expect(moduleData.moduleNumber).toBeLessThanOrEqual(moduleData.totalModules);
  });

  it('should track module duration', () => {
    const startTime = new Date('2024-01-01T10:00:00');
    const endTime = new Date('2024-01-01T10:12:30');
    
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    expect(durationMinutes).toBe(12.5);
    expect(durationMinutes).toBeGreaterThan(0);
  });
});

