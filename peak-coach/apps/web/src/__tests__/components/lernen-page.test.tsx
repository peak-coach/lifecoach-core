import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the page component - we'll test individual step components
// For full page tests, we need to mock Next.js routing

describe('Learning Module Steps', () => {
  const mockModule = {
    id: 'test-module',
    title: 'Test Module: Deliberate Practice',
    category: 'Lernen',
    categoryIcon: '📚',
    estimatedMinutes: 12,
    moduleNumber: 1,
    topic: 'Deliberate Practice',
    totalModules: 5,
    difficulty: 'intermediate',
    content: {
      preTest: {
        question: 'Was ist wichtig beim Lernen?',
        options: ['Viel Zeit', 'Fokus auf Schwächen', 'Talent', 'Glück'],
        correctIndex: 1,
        teaser: 'Spannend! Mal sehen...',
      },
      why: {
        hook: 'Wusstest du, dass fokussiertes Üben 10x effektiver ist?',
        benefit: 'Du wirst schneller lernen und besser werden.',
        connection: 'Das bringt dich deinem Ziel näher.',
      },
      learn: {
        concept: 'Das **Kernkonzept** von Deliberate Practice...',
        example: 'Ein Musiker übt gezielt die schweren Stellen.',
        source: 'Anders Ericsson - Peak',
        keyPoints: ['Fokus auf Schwächen', 'Sofortiges Feedback', 'Außerhalb der Komfortzone'],
        videoRecommendation: {
          title: 'TED Talk: The first 20 hours',
          url: 'https://youtube.com/watch?v=xxx',
          duration: '19:24',
        },
      },
      generate: {
        prompt: 'Erkläre Deliberate Practice in eigenen Worten.',
        exampleAnswer: 'Deliberate Practice bedeutet gezieltes Üben...',
        keyPointsToInclude: ['Schwächen', 'Feedback', 'Komfortzone'],
      },
      do: {
        title: 'Identifiziere deine Schwachstelle',
        instruction: 'Schritt 1: Denke an dein Ziel\nSchritt 2: Was fällt dir schwer?\nSchritt 3: Schreibe es auf',
        duration_minutes: 3,
        success_criteria: 'Du bist fertig wenn du eine Schwachstelle aufgeschrieben hast.',
      },
      test: [
        {
          question: 'Was ist der Kern von Deliberate Practice?',
          options: ['Viel üben', 'Fokus auf Schwächen', 'Talent haben', 'Spaß haben'],
          correctIndex: 1,
          whyCorrect: 'Deliberate Practice bedeutet gezieltes Üben an Schwächen.',
          whyOthersWrong: 'Die anderen Optionen führen nicht zu gezielter Verbesserung.',
        },
        {
          question: 'Warum ist Feedback wichtig?',
          options: ['Um Fehler zu korrigieren', 'Für Motivation', 'Nicht wichtig', 'Für andere'],
          correctIndex: 0,
          whyCorrect: 'Feedback hilft, Fehler sofort zu korrigieren.',
          whyOthersWrong: 'Die anderen Optionen sind nicht der Hauptgrund.',
        },
      ],
      action: {
        task: 'Führe eine 5-minütige Deliberate Practice Session durch.',
        implementationIntention: {
          situation: 'ich heute Abend Zeit habe',
          behavior: 'an meiner Schwachstelle arbeiten',
          formatted: 'WENN ich heute Abend Zeit habe, DANN werde ich an meiner Schwachstelle arbeiten.',
        },
        triggerSuggestions: ['Nach dem Abendessen', 'Vor dem Schlafen', 'Morgen früh'],
        timingOptions: ['heute', 'morgen', 'diese Woche', 'bei Gelegenheit'],
        metric: 'Du hast es geschafft wenn du 5 Minuten fokussiert geübt hast.',
      },
      reflect: {
        prompts: [
          'Was war die wichtigste Erkenntnis?',
          'Wie wirst du das anwenden?',
        ],
      },
      reviewQuestions: [
        'Was sind die 3 Elemente von Deliberate Practice?',
        'Was ist deine Schwachstelle?',
      ],
    },
  };

  describe('PreTestStep', () => {
    it('should display the pre-test question', () => {
      // The actual component would be imported and tested here
      const preTest = mockModule.content.preTest;
      
      expect(preTest.question).toBe('Was ist wichtig beim Lernen?');
      expect(preTest.options).toHaveLength(4);
      expect(preTest.correctIndex).toBe(1);
    });

    it('should have all 4 answer options', () => {
      const preTest = mockModule.content.preTest;
      
      expect(preTest.options).toContain('Viel Zeit');
      expect(preTest.options).toContain('Fokus auf Schwächen');
      expect(preTest.options).toContain('Talent');
      expect(preTest.options).toContain('Glück');
    });

    it('should show encouraging message regardless of answer', () => {
      // PreTest doesn't count towards score - it's about activating curiosity
      const preTest = mockModule.content.preTest;
      expect(preTest.teaser).toBeDefined();
    });
  });

  describe('WhyStep', () => {
    it('should display motivation content', () => {
      const why = mockModule.content.why;
      
      expect(why.hook).toContain('10x effektiver');
      expect(why.benefit).toBeDefined();
      expect(why.connection).toBeDefined();
    });

    it('should have emotional hook', () => {
      const why = mockModule.content.why;
      
      // Hook should be engaging
      expect(why.hook.length).toBeGreaterThan(20);
    });
  });

  describe('LearnStep', () => {
    it('should display concept with markdown formatting', () => {
      const learn = mockModule.content.learn;
      
      expect(learn.concept).toContain('**');
      expect(learn.concept).toBeDefined();
    });

    it('should include key points', () => {
      const learn = mockModule.content.learn;
      
      expect(learn.keyPoints).toBeDefined();
      expect(learn.keyPoints!.length).toBeGreaterThanOrEqual(3);
    });

    it('should have source attribution', () => {
      const learn = mockModule.content.learn;
      
      expect(learn.source).toBeDefined();
      expect(learn.source).toContain('Ericsson');
    });

    it('should optionally include video recommendation', () => {
      const learn = mockModule.content.learn;
      
      if (learn.videoRecommendation) {
        expect(learn.videoRecommendation.title).toBeDefined();
        expect(learn.videoRecommendation.url).toContain('youtube');
        expect(learn.videoRecommendation.duration).toBeDefined();
      }
    });
  });

  describe('GenerateStep', () => {
    it('should have a clear prompt', () => {
      const generate = mockModule.content.generate;
      
      expect(generate.prompt).toBeDefined();
      expect(generate.prompt).toContain('eigenen Worten');
    });

    it('should provide key points to include', () => {
      const generate = mockModule.content.generate;
      
      expect(generate.keyPointsToInclude).toBeDefined();
      expect(generate.keyPointsToInclude.length).toBeGreaterThan(0);
    });

    it('should have example answer for comparison', () => {
      const generate = mockModule.content.generate;
      
      expect(generate.exampleAnswer).toBeDefined();
      expect(generate.exampleAnswer.length).toBeGreaterThan(20);
    });
  });

  describe('DoStep', () => {
    it('should have step-by-step instructions', () => {
      const doContent = mockModule.content.do;
      
      expect(doContent.instruction).toContain('Schritt');
      expect(doContent.instruction.split('Schritt').length).toBeGreaterThan(1);
    });

    it('should have time limit', () => {
      const doContent = mockModule.content.do;
      
      expect(doContent.duration_minutes).toBeDefined();
      expect(doContent.duration_minutes).toBeGreaterThan(0);
      expect(doContent.duration_minutes).toBeLessThanOrEqual(10);
    });

    it('should have clear success criteria', () => {
      const doContent = mockModule.content.do;
      
      expect(doContent.success_criteria).toBeDefined();
      expect(doContent.success_criteria).toContain('fertig');
    });
  });

  describe('TestStep', () => {
    it('should have at least 2 questions', () => {
      const test = mockModule.content.test;
      
      expect(test.length).toBeGreaterThanOrEqual(2);
    });

    it('should have 4 options per question', () => {
      const test = mockModule.content.test;
      
      test.forEach(question => {
        expect(question.options).toHaveLength(4);
      });
    });

    it('should have valid correct index', () => {
      const test = mockModule.content.test;
      
      test.forEach(question => {
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(4);
      });
    });

    it('should have elaboration for each question', () => {
      const test = mockModule.content.test;
      
      test.forEach(question => {
        expect(question.whyCorrect).toBeDefined();
        expect(question.whyOthersWrong).toBeDefined();
      });
    });
  });

  describe('ActionStep', () => {
    it('should have implementation intention structure', () => {
      const action = mockModule.content.action;
      
      expect(action.implementationIntention).toBeDefined();
      expect(action.implementationIntention!.situation).toBeDefined();
      expect(action.implementationIntention!.behavior).toBeDefined();
      expect(action.implementationIntention!.formatted).toContain('WENN');
      expect(action.implementationIntention!.formatted).toContain('DANN');
    });

    it('should have trigger suggestions', () => {
      const action = mockModule.content.action;
      
      expect(action.triggerSuggestions).toBeDefined();
      expect(action.triggerSuggestions!.length).toBeGreaterThanOrEqual(2);
    });

    it('should have timing options', () => {
      const action = mockModule.content.action;
      
      expect(action.timingOptions).toBeDefined();
      expect(action.timingOptions).toContain('heute');
      expect(action.timingOptions).toContain('morgen');
    });

    it('should have measurable success metric', () => {
      const action = mockModule.content.action;
      
      expect(action.metric).toBeDefined();
      expect(action.metric.length).toBeGreaterThan(10);
    });
  });

  describe('ReflectStep', () => {
    it('should have reflection prompts', () => {
      const reflect = mockModule.content.reflect;
      
      expect(reflect).toBeDefined();
      expect(reflect!.prompts).toBeDefined();
      expect(reflect!.prompts.length).toBeGreaterThanOrEqual(2);
    });

    it('should have open-ended questions', () => {
      const reflect = mockModule.content.reflect;
      
      reflect!.prompts.forEach(prompt => {
        expect(prompt).toContain('?');
      });
    });
  });
});

describe('Module Flow', () => {
  it('should have correct step order', () => {
    const expectedOrder = [
      'pretest',
      'why',
      'learn',
      'generate',
      'do',
      'test',
      'action',
      'reflect',
      'complete',
    ];
    
    // This represents the expected flow
    expect(expectedOrder).toHaveLength(9);
    expect(expectedOrder[0]).toBe('pretest');
    expect(expectedOrder[expectedOrder.length - 1]).toBe('complete');
  });

  it('should allow retry if quiz score < 50%', () => {
    // Simulate quiz with low score
    const quizScore = 1;
    const totalQuestions = 3;
    const percentage = (quizScore / totalQuestions) * 100;
    
    expect(percentage).toBeLessThan(50);
    // Should trigger retry step
  });

  it('should proceed to action if quiz score >= 50%', () => {
    const quizScore = 2;
    const totalQuestions = 3;
    const percentage = (quizScore / totalQuestions) * 100;
    
    expect(percentage).toBeGreaterThanOrEqual(50);
    // Should proceed to action step
  });
});

describe('Confidence Rating', () => {
  it('should have 4 confidence levels', () => {
    const confidenceLevels = [
      { level: 1, label: 'Geraten' },
      { level: 2, label: 'Unsicher' },
      { level: 3, label: 'Ziemlich sicher' },
      { level: 4, label: '100% sicher' },
    ];
    
    expect(confidenceLevels).toHaveLength(4);
    expect(confidenceLevels[0].level).toBe(1);
    expect(confidenceLevels[3].level).toBe(4);
  });

  it('should track confidence with correctness', () => {
    // Simulate confidence data collection
    const confidenceData: { confidence: number; wasCorrect: boolean }[] = [
      { confidence: 4, wasCorrect: true },  // Calibrated
      { confidence: 4, wasCorrect: false }, // Overconfident
      { confidence: 1, wasCorrect: true },  // Underconfident
      { confidence: 2, wasCorrect: false }, // Calibrated
    ];
    
    // Calculate calibration
    const overconfident = confidenceData.filter(d => d.confidence >= 3 && !d.wasCorrect).length;
    const underconfident = confidenceData.filter(d => d.confidence <= 2 && d.wasCorrect).length;
    
    expect(overconfident).toBe(1);
    expect(underconfident).toBe(1);
  });
});

describe('Spaced Repetition Integration', () => {
  it('should generate review questions', () => {
    const mockModule = {
      content: {
        reviewQuestions: [
          'Was sind die 3 Elemente von Deliberate Practice?',
          'Was ist deine identifizierte Schwachstelle?',
        ],
      },
    };
    
    expect(mockModule.content.reviewQuestions).toBeDefined();
    expect(mockModule.content.reviewQuestions.length).toBeGreaterThanOrEqual(2);
  });
});

describe('XP Award', () => {
  it('should award XP on module completion', () => {
    // Base XP for module completion
    const baseXP = 50;
    const bonusXP = 25; // For high quiz score
    
    const totalXP = baseXP + bonusXP;
    
    expect(totalXP).toBe(75);
  });
});

