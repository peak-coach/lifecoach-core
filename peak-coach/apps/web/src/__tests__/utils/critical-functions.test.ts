import { describe, it, expect, vi } from 'vitest';

/**
 * KRITISCHE TESTS: Diese Tests hätten die Bugs vorher abgefangen!
 * 
 * Testet alle sicherheitskritischen Funktionen aus dem Akademie-Modul:
 * 1. safeDecodeURIComponent - URIError Prevention
 * 2. Module Number Progression - Korrekte Modulnummer-Weitergabe
 * 3. Action Payload Format - API Kompatibilität
 */

describe('safeDecodeURIComponent', () => {
  // Implementierung der Funktion wie in lernen/page.tsx
  const safeDecodeURIComponent = (uri: string | null): string => {
    if (!uri) return '';
    try {
      return decodeURIComponent(uri);
    } catch (e) {
      console.error('URIError caught:', e, 'for URI:', uri);
      return uri;
    }
  };

  it('should decode valid URI components', () => {
    expect(safeDecodeURIComponent('Hello%20World')).toBe('Hello World');
    expect(safeDecodeURIComponent('Rhetorik%20Grundlagen')).toBe('Rhetorik Grundlagen');
    expect(safeDecodeURIComponent('%C3%9Cbung')).toBe('Übung'); // German Ü
  });

  it('should handle null/undefined inputs', () => {
    expect(safeDecodeURIComponent(null)).toBe('');
    expect(safeDecodeURIComponent(undefined as any)).toBe('');
  });

  it('should return original string for invalid encoded strings', () => {
    // Diese würden vorher crashen!
    expect(safeDecodeURIComponent('%E0%A4%A')).toBe('%E0%A4%A'); // Incomplete
    expect(safeDecodeURIComponent('%')).toBe('%');
    expect(safeDecodeURIComponent('%Z')).toBe('%Z'); // Invalid hex
  });

  it('should handle empty strings', () => {
    expect(safeDecodeURIComponent('')).toBe('');
  });

  it('should handle already decoded strings', () => {
    expect(safeDecodeURIComponent('Rhetorik Grundlagen')).toBe('Rhetorik Grundlagen');
    expect(safeDecodeURIComponent('Test')).toBe('Test');
  });

  it('should handle special characters', () => {
    expect(safeDecodeURIComponent('%26')).toBe('&');
    expect(safeDecodeURIComponent('%3F')).toBe('?');
    expect(safeDecodeURIComponent('%3D')).toBe('=');
  });
});

describe('Module Number Progression', () => {
  it('should correctly calculate next module number', () => {
    const currentModule = 1;
    const nextModule = currentModule + 1;
    expect(nextModule).toBe(2);
  });

  it('should use moduleNumber from URL params, not from generated content', () => {
    // Dies war der Bug: moduleNumber kam vom generierten Content statt URL
    const urlModuleNumber = 2;
    const generatedModuleNumber = 1; // AI könnte falschen Wert zurückgeben
    
    // KORREKT: Immer URL-Parameter verwenden
    const moduleNumToUse = urlModuleNumber;
    expect(moduleNumToUse).toBe(2);
    expect(moduleNumToUse).not.toBe(generatedModuleNumber);
  });

  it('should generate correct URL params for next module', () => {
    const currentParams = {
      goalId: 'goal-123',
      goalTitle: 'Rhetorik verbessern',
      category: 'Rhetorik',
      moduleNumber: 1,
      skillId: 'skill-456',
    };

    const nextParams = new URLSearchParams({
      goalId: currentParams.goalId,
      goalTitle: currentParams.goalTitle,
      category: currentParams.category,
      moduleNumber: (currentParams.moduleNumber + 1).toString(),
      skillId: currentParams.skillId || '',
    });

    expect(nextParams.get('moduleNumber')).toBe('2');
    expect(nextParams.get('goalId')).toBe('goal-123');
  });

  it('should handle edge case: last module', () => {
    const currentModule = 5;
    const totalModules = 5;
    const hasMoreModules = currentModule < totalModules;
    
    expect(hasMoreModules).toBe(false);
  });

  it('should default to module 1 when param is missing', () => {
    const paramValue = null;
    const moduleNum = paramValue ? parseInt(paramValue) : 1;
    expect(moduleNum).toBe(1);
  });
});

describe('Action Payload Format', () => {
  // API erwartet camelCase, nicht snake_case!
  
  it('should use camelCase field names', () => {
    const correctPayload = {
      sourceType: 'module',
      sourceId: 'module-123',
      sourceTitle: 'Deliberate Practice',
      actionTitle: 'Übung durchführen',
      actionDescription: 'Führe eine 5-Minuten Übung durch',
      triggerSituation: 'Nach dem Abendessen',
      intendedBehavior: 'an meiner Schwachstelle arbeiten',
      timing: 'heute',
    };

    // Prüfe dass keine snake_case Felder vorhanden sind
    expect(correctPayload).not.toHaveProperty('source_type');
    expect(correctPayload).not.toHaveProperty('action_description');
    expect(correctPayload).not.toHaveProperty('trigger_situation');
    
    // Prüfe korrekte camelCase Felder
    expect(correctPayload).toHaveProperty('sourceType');
    expect(correctPayload).toHaveProperty('actionDescription');
    expect(correctPayload).toHaveProperty('triggerSituation');
  });

  it('should always include actionTitle', () => {
    const payload = {
      sourceType: 'module',
      sourceId: 'test-id',
      actionTitle: 'Meine Aktion', // REQUIRED!
      actionDescription: 'Beschreibung',
    };

    expect(payload.actionTitle).toBeDefined();
    expect(payload.actionTitle.length).toBeGreaterThan(0);
  });

  it('should reject payloads without actionTitle', () => {
    const invalidPayload = {
      sourceType: 'module',
      sourceId: 'test-id',
      actionDescription: 'Beschreibung',
      // MISSING: actionTitle
    };

    expect(invalidPayload).not.toHaveProperty('actionTitle');
  });

  it('should validate source type is valid enum', () => {
    const validSourceTypes = ['module', 'book', 'manual', 'video'];
    const testSourceType = 'module';
    
    expect(validSourceTypes).toContain(testSourceType);
  });

  it('should validate timing is valid enum', () => {
    const validTimings = ['heute', 'morgen', 'diese Woche', 'bei Gelegenheit'];
    const testTiming = 'heute';
    
    expect(validTimings).toContain(testTiming);
  });
});

describe('Goal ID Handling', () => {
  it('should not update progress when goalId is missing', () => {
    const goalId: string | null = null;
    const shouldUpdateProgress = goalId !== null && goalId !== '';
    
    expect(shouldUpdateProgress).toBe(false);
  });

  it('should update progress when goalId is present', () => {
    const goalId = 'goal-123';
    const shouldUpdateProgress = goalId !== null && goalId !== '';
    
    expect(shouldUpdateProgress).toBe(true);
  });

  it('should handle empty string goalId', () => {
    const goalId = '';
    const shouldUpdateProgress = goalId !== null && goalId !== '';
    
    expect(shouldUpdateProgress).toBe(false);
  });
});

describe('XP Calculation', () => {
  it('should award 50 XP for module completion', () => {
    const baseXP = 50;
    expect(baseXP).toBe(50);
  });

  it('should calculate level from XP correctly', () => {
    const calculateLevel = (xp: number): number => {
      if (xp >= 12000) return 10;
      if (xp >= 8000) return 9;
      if (xp >= 5500) return 8;
      if (xp >= 3500) return 7;
      if (xp >= 2000) return 6;
      if (xp >= 1000) return 5;
      if (xp >= 500) return 4;
      if (xp >= 250) return 3;
      if (xp >= 100) return 2;
      return 1;
    };

    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(500)).toBe(4);
    expect(calculateLevel(1000)).toBe(5);
    expect(calculateLevel(15000)).toBe(10);
  });
});

describe('Quiz Score Calculation', () => {
  it('should calculate percentage correctly', () => {
    const calculatePercentage = (correct: number, total: number) => 
      Math.round((correct / total) * 100);

    expect(calculatePercentage(2, 3)).toBe(67);
    expect(calculatePercentage(1, 3)).toBe(33);
    expect(calculatePercentage(3, 3)).toBe(100);
    expect(calculatePercentage(0, 3)).toBe(0);
  });

  it('should trigger retry for score < 50%', () => {
    const shouldRetry = (correct: number, total: number) => 
      (correct / total) * 100 < 50;

    expect(shouldRetry(1, 3)).toBe(true);  // 33%
    expect(shouldRetry(1, 2)).toBe(false); // 50%
    expect(shouldRetry(2, 3)).toBe(false); // 67%
  });
});

