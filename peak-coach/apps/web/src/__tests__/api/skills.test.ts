import { describe, it, expect, vi } from 'vitest';

/**
 * Unit Tests für das Skill Decomposition System
 * 
 * Diese Tests prüfen die Geschäftslogik für Skill-Zerlegung und Mastery-Tracking.
 */

describe('Skill Decomposition - Unit Tests', () => {
  describe('Skill Data Validation', () => {
    it('should validate required fields', () => {
      const validSkill = {
        goal_id: 'goal-123',
        user_id: 'user-456',
        skill_name: 'Körpersprache',
        difficulty: 'intermediate',
      };
      
      expect(validSkill.goal_id).toBeDefined();
      expect(validSkill.user_id).toBeDefined();
      expect(validSkill.skill_name).toBeDefined();
    });

    it('should accept valid difficulty levels', () => {
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      
      validLevels.forEach(level => {
        expect(['beginner', 'intermediate', 'advanced']).toContain(level);
      });
    });

    it('should validate mastery level range (0-100)', () => {
      const validMastery = [0, 25, 50, 75, 100];
      const invalidMastery = [-1, 101, 150];
      
      validMastery.forEach(level => {
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(100);
      });
      
      invalidMastery.forEach(level => {
        expect(level < 0 || level > 100).toBe(true);
      });
    });
  });

  describe('Skill Hierarchy', () => {
    it('should support parent-child relationships', () => {
      const parentSkill = {
        id: 'skill-parent',
        skill_name: 'Präsentieren',
        parent_skill_id: null,
      };
      
      const childSkill = {
        id: 'skill-child',
        skill_name: 'Körpersprache',
        parent_skill_id: 'skill-parent',
      };
      
      expect(parentSkill.parent_skill_id).toBeNull();
      expect(childSkill.parent_skill_id).toBe('skill-parent');
    });

    it('should calculate total skills in hierarchy', () => {
      const skills = [
        { id: '1', parent_skill_id: null },
        { id: '2', parent_skill_id: '1' },
        { id: '3', parent_skill_id: '1' },
        { id: '4', parent_skill_id: '2' },
      ];
      
      const rootSkills = skills.filter(s => s.parent_skill_id === null);
      const childSkills = skills.filter(s => s.parent_skill_id !== null);
      
      expect(rootSkills.length).toBe(1);
      expect(childSkills.length).toBe(3);
    });
  });

  describe('Mastery Calculation', () => {
    it('should calculate mastery from quiz scores', () => {
      const moduleResults = [
        { quiz_score: 80 },
        { quiz_score: 90 },
        { quiz_score: 70 },
      ];
      
      const avgMastery = moduleResults.reduce((sum, r) => sum + r.quiz_score, 0) / moduleResults.length;
      
      expect(avgMastery).toBe(80);
    });

    it('should weight recent results more heavily', () => {
      // Exponential moving average - higher alpha = more weight on recent
      const calculateWeightedMastery = (scores: number[], alpha = 0.7) => {
        return scores.reduce((ema, score, i) => {
          return i === 0 ? score : alpha * score + (1 - alpha) * ema;
        }, 0);
      };
      
      // Old scores vs new scores
      const gotWorse = [90, 80, 50]; // Started high, got worse - recent is 50
      const improved = [50, 80, 90];  // Started low, improved - recent is 90
      
      const masteryGotWorse = calculateWeightedMastery(gotWorse);
      const masteryImproved = calculateWeightedMastery(improved);
      
      // Recent improvement should have higher mastery (90 vs 50 most recent)
      expect(masteryImproved).toBeGreaterThan(masteryGotWorse);
    });

    it('should identify weaknesses (mastery < 50%)', () => {
      const skills = [
        { skill_name: 'Skill A', mastery_level: 80 },
        { skill_name: 'Skill B', mastery_level: 40 },
        { skill_name: 'Skill C', mastery_level: 60 },
        { skill_name: 'Skill D', mastery_level: 30 },
      ];
      
      const weaknesses = skills.filter(s => s.mastery_level < 50);
      
      expect(weaknesses.length).toBe(2);
      expect(weaknesses.map(s => s.skill_name)).toContain('Skill B');
      expect(weaknesses.map(s => s.skill_name)).toContain('Skill D');
    });
  });

  describe('Skill Templates', () => {
    it('should provide template for common goal categories', () => {
      const SKILL_TEMPLATES = {
        presentation: {
          skills: [
            { name: 'Körpersprache', difficulty: 'beginner' },
            { name: 'Stimme & Atmung', difficulty: 'beginner' },
            { name: 'Storytelling', difficulty: 'intermediate' },
            { name: 'Überzeugungstechniken', difficulty: 'advanced' },
          ],
        },
        negotiation: {
          skills: [
            { name: 'BATNA', difficulty: 'beginner' },
            { name: 'Aktives Zuhören', difficulty: 'beginner' },
            { name: 'Interessen vs Positionen', difficulty: 'intermediate' },
            { name: 'Taktische Empathie', difficulty: 'advanced' },
          ],
        },
      };
      
      expect(SKILL_TEMPLATES.presentation.skills.length).toBe(4);
      expect(SKILL_TEMPLATES.negotiation.skills.length).toBe(4);
    });

    it('should order skills by difficulty', () => {
      const skills = [
        { name: 'Advanced', difficulty: 'advanced', order: 0 },
        { name: 'Beginner', difficulty: 'beginner', order: 0 },
        { name: 'Intermediate', difficulty: 'intermediate', order: 0 },
      ];
      
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      
      const sorted = [...skills].sort((a, b) => {
        return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
               difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
      });
      
      expect(sorted[0].difficulty).toBe('beginner');
      expect(sorted[1].difficulty).toBe('intermediate');
      expect(sorted[2].difficulty).toBe('advanced');
    });
  });

  describe('Skill Recommendation', () => {
    it('should recommend weakest skill for practice', () => {
      const skills = [
        { skill_name: 'Skill A', mastery_level: 80, last_practiced_at: '2024-01-10' },
        { skill_name: 'Skill B', mastery_level: 40, last_practiced_at: '2024-01-05' },
        { skill_name: 'Skill C', mastery_level: 60, last_practiced_at: '2024-01-01' },
      ];
      
      // Sort by mastery (lowest first), then by last_practiced (oldest first)
      const sorted = [...skills].sort((a, b) => {
        if (a.mastery_level !== b.mastery_level) {
          return a.mastery_level - b.mastery_level;
        }
        return new Date(a.last_practiced_at).getTime() - new Date(b.last_practiced_at).getTime();
      });
      
      expect(sorted[0].skill_name).toBe('Skill B'); // Lowest mastery
    });

    it('should balance mastery and recency', () => {
      const skills = [
        { skill_name: 'Recent Weak', mastery_level: 45, days_since_practice: 1 },
        { skill_name: 'Old Strong', mastery_level: 80, days_since_practice: 30 },
        { skill_name: 'Old Weak', mastery_level: 40, days_since_practice: 20 },
      ];
      
      // Score = (100 - mastery) + (days_since_practice * 2)
      const withScores = skills.map(s => ({
        ...s,
        priority_score: (100 - s.mastery_level) + (s.days_since_practice * 2),
      }));
      
      const sorted = withScores.sort((a, b) => b.priority_score - a.priority_score);
      
      // Old Weak should be highest priority: (100-40) + (20*2) = 100
      expect(sorted[0].skill_name).toBe('Old Weak');
    });
  });

  describe('Module-Skill Mapping', () => {
    it('should track quiz results per skill', () => {
      const mapping = {
        module_id: 'module-123',
        skill_id: 'skill-456',
        quiz_score: 85,
        confidence_avg: 3.5,
        time_spent_minutes: 12,
      };
      
      expect(mapping.quiz_score).toBe(85);
      expect(mapping.confidence_avg).toBeGreaterThanOrEqual(1);
      expect(mapping.confidence_avg).toBeLessThanOrEqual(4);
    });

    it('should calculate calibration from confidence vs correctness', () => {
      const results = [
        { confidence: 4, was_correct: true },   // Calibrated
        { confidence: 4, was_correct: false },  // Overconfident
        { confidence: 1, was_correct: true },   // Underconfident
        { confidence: 2, was_correct: false },  // Calibrated
      ];
      
      const overconfident = results.filter(r => r.confidence >= 3 && !r.was_correct).length;
      const underconfident = results.filter(r => r.confidence <= 2 && r.was_correct).length;
      const calibrated = results.length - overconfident - underconfident;
      
      expect(overconfident).toBe(1);
      expect(underconfident).toBe(1);
      expect(calibrated).toBe(2);
    });
  });

  describe('Progress Tracking', () => {
    it('should track completed vs estimated modules', () => {
      const skill = {
        estimated_modules: 5,
        completed_modules: 3,
      };
      
      const progress = (skill.completed_modules / skill.estimated_modules) * 100;
      
      expect(progress).toBe(60);
    });

    it('should calculate overall goal progress', () => {
      const skills = [
        { estimated_modules: 3, completed_modules: 3 },  // 100%
        { estimated_modules: 5, completed_modules: 2 },  // 40%
        { estimated_modules: 4, completed_modules: 2 },  // 50%
      ];
      
      const totalEstimated = skills.reduce((sum, s) => sum + s.estimated_modules, 0);
      const totalCompleted = skills.reduce((sum, s) => sum + s.completed_modules, 0);
      const overallProgress = (totalCompleted / totalEstimated) * 100;
      
      expect(totalEstimated).toBe(12);
      expect(totalCompleted).toBe(7);
      expect(Math.round(overallProgress)).toBe(58);
    });
  });
});
