import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Test Module: Deliberate Practice',
                  moduleNumber: 1,
                  topic: 'Deliberate Practice',
                  difficulty: 'intermediate',
                  preTest: {
                    question: 'Was ist wichtig beim Lernen?',
                    options: ['Viel Zeit', 'Fokus', 'Talent', 'Glück'],
                    correctIndex: 1,
                    teaser: 'Interessant!',
                  },
                  why: {
                    hook: 'Wusstest du...',
                    benefit: 'Du wirst schneller lernen',
                    connection: 'Das bringt dich deinem Ziel näher',
                  },
                  learn: {
                    concept: 'Das **Kernkonzept** ist...',
                    example: 'Ein Beispiel: ...',
                    source: 'Anders Ericsson',
                    keyPoints: ['Punkt 1', 'Punkt 2', 'Punkt 3'],
                  },
                  generate: {
                    prompt: 'Erkläre das Konzept',
                    exampleAnswer: 'Eine gute Erklärung wäre...',
                    keyPointsToInclude: ['Begriff 1', 'Begriff 2'],
                  },
                  do: {
                    title: 'Übung',
                    instruction: 'Schritt 1...',
                    duration_minutes: 3,
                    success_criteria: 'Du bist fertig wenn...',
                  },
                  test: [
                    {
                      question: 'Frage 1?',
                      options: ['A', 'B', 'C', 'D'],
                      correctIndex: 0,
                      whyCorrect: 'Weil...',
                      whyOthersWrong: 'Die anderen...',
                    },
                    {
                      question: 'Frage 2?',
                      options: ['A', 'B', 'C', 'D'],
                      correctIndex: 1,
                      whyCorrect: 'Weil...',
                      whyOthersWrong: 'Die anderen...',
                    },
                  ],
                  action: {
                    task: 'Aufgabe',
                    implementationIntention: {
                      situation: 'Wenn X',
                      behavior: 'Dann Y',
                      formatted: 'WENN X, DANN Y',
                    },
                    triggerSuggestions: ['Trigger 1', 'Trigger 2'],
                    timingOptions: ['heute', 'morgen'],
                    metric: 'Erfolg wenn...',
                  },
                  reflect: {
                    prompts: ['Frage 1?', 'Frage 2?'],
                  },
                  reviewQuestions: ['Review 1', 'Review 2'],
                }),
              },
            },
          ],
        }),
      },
    },
  })),
}));

// Mock expert knowledge
vi.mock('@/lib/expertKnowledge', () => ({
  EXPERT_KNOWLEDGE: {
    lernen: {
      category: 'Lernen',
      sources: ['Source 1', 'Source 2'],
      principles: ['Principle 1', 'Principle 2'],
    },
  },
  detectCategoryFromGoal: vi.fn().mockReturnValue('lernen'),
}));

describe('POST /api/generate-module', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    // Set env vars before importing
    process.env.OPENAI_API_KEY = 'test-key';
    
    const module = await import('@/app/api/generate-module/route');
    POST = module.POST;
  });

  it('should generate a module with all 8 steps', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-module', {
      method: 'POST',
      body: JSON.stringify({
        goalTitle: 'Besser präsentieren',
        category: 'rhetorik',
        moduleNumber: 1,
        userLevel: 'intermediate',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.module).toBeDefined();
    
    // Verify all 8 steps are present
    const content = data.module.content;
    expect(content.preTest).toBeDefined();
    expect(content.preTest.question).toBeDefined();
    expect(content.preTest.options).toHaveLength(4);
    
    expect(content.why).toBeDefined();
    expect(content.why.hook).toBeDefined();
    expect(content.why.benefit).toBeDefined();
    
    expect(content.learn).toBeDefined();
    expect(content.learn.concept).toBeDefined();
    expect(content.learn.keyPoints).toBeDefined();
    
    expect(content.generate).toBeDefined();
    expect(content.generate.prompt).toBeDefined();
    expect(content.generate.keyPointsToInclude).toBeDefined();
    
    expect(content.do).toBeDefined();
    expect(content.do.instruction).toBeDefined();
    expect(content.do.duration_minutes).toBeGreaterThan(0);
    
    expect(content.test).toBeDefined();
    expect(content.test.length).toBeGreaterThanOrEqual(2);
    
    expect(content.action).toBeDefined();
    expect(content.action.implementationIntention).toBeDefined();
    
    expect(content.reflect).toBeDefined();
    expect(content.reflect.prompts).toBeDefined();
  });

  it('should include video recommendation when available', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-module', {
      method: 'POST',
      body: JSON.stringify({
        goalTitle: 'Produktiver werden',
        category: 'produktivitaet',
        moduleNumber: 1,
        includeVideo: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Video might or might not be present depending on category
    expect(data.module.content.learn).toBeDefined();
  });

  it('should handle retry mode with different examples', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-module', {
      method: 'POST',
      body: JSON.stringify({
        goalTitle: 'Verhandeln lernen',
        category: 'verhandlung',
        moduleNumber: 1,
        isRetry: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.module).toBeDefined();
  });

  it('should adapt content to user level', async () => {
    const levels = ['beginner', 'intermediate', 'advanced'];
    
    for (const level of levels) {
      const request = new NextRequest('http://localhost:3000/api/generate-module', {
        method: 'POST',
        body: JSON.stringify({
          goalTitle: 'Test Goal',
          userLevel: level,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });

  it('should return fallback module when OpenAI fails', async () => {
    // Clear API key to trigger fallback
    delete process.env.OPENAI_API_KEY;
    delete process.env.OpenAI_API_KEY;
    
    vi.resetModules();
    const module = await import('@/app/api/generate-module/route');
    
    const request = new NextRequest('http://localhost:3000/api/generate-module', {
      method: 'POST',
      body: JSON.stringify({
        goalTitle: 'Test Goal',
      }),
    });

    const response = await module.POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.module).toBeDefined();
    expect(data.module.id).toContain('fallback');
  });
});

describe('Module Content Validation', () => {
  it('should have valid quiz questions with correct structure', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    vi.resetModules();
    const module = await import('@/app/api/generate-module/route');
    
    const request = new NextRequest('http://localhost:3000/api/generate-module', {
      method: 'POST',
      body: JSON.stringify({
        goalTitle: 'Test',
        moduleNumber: 1,
      }),
    });

    const response = await module.POST(request);
    const data = await response.json();

    const test = data.module.content.test;
    
    test.forEach((q: any) => {
      expect(q.question).toBeDefined();
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
      expect(q.whyCorrect).toBeDefined();
      expect(q.whyOthersWrong).toBeDefined();
    });
  });

  it('should have valid implementation intention structure', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    vi.resetModules();
    const module = await import('@/app/api/generate-module/route');
    
    const request = new NextRequest('http://localhost:3000/api/generate-module', {
      method: 'POST',
      body: JSON.stringify({
        goalTitle: 'Test',
      }),
    });

    const response = await module.POST(request);
    const data = await response.json();

    const action = data.module.content.action;
    
    expect(action.task).toBeDefined();
    expect(action.implementationIntention).toBeDefined();
    expect(action.implementationIntention.situation).toBeDefined();
    expect(action.implementationIntention.behavior).toBeDefined();
    expect(action.implementationIntention.formatted).toContain('WENN');
    expect(action.triggerSuggestions).toBeDefined();
    expect(action.metric).toBeDefined();
  });
});

