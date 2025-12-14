// ============================================
// PEAK COACH - Zod Schemas for Validation
// ============================================

import { z } from 'zod';

// Check-in Schemas
export const morningCheckinSchema = z.object({
  mood: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  sleep_hours: z.number().min(0).max(24),
  sleep_quality: z.number().min(1).max(10),
  notes: z.string().optional(),
});

export const eveningReviewSchema = z.object({
  mood: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  wins: z.array(z.string()),
  struggles: z.array(z.string()),
  grateful_for: z.array(z.string()),
  learnings: z.string().optional(),
  tomorrow_focus: z.string().optional(),
});

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  estimated_minutes: z.number().min(1).max(480).optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  energy_required: z.enum(['high', 'medium', 'low']).default('medium'),
  category: z.string().optional(),
  goal_id: z.string().uuid().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  estimated_minutes: z.number().min(1).max(480).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  energy_required: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'postponed']).optional(),
  skip_reason: z.string().optional(),
});

// Goal Schemas
export const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['career', 'health', 'learning', 'finance', 'relationships', 'personal']),
  target_value: z.number().optional(),
  unit: z.string().optional(),
  deadline: z.string().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  current_value: z.number().optional(),
  status: z.enum(['active', 'completed', 'paused', 'abandoned']).optional(),
});

// Habit Schemas
export const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['health', 'productivity', 'mindset', 'social']),
  frequency: z.enum(['daily', 'weekly', 'specific_days']).default('daily'),
  target_days: z.array(z.string()).optional(),
  preferred_time: z.string().optional(),
  reminder_enabled: z.boolean().default(true),
});

export const habitLogSchema = z.object({
  completed: z.boolean(),
  notes: z.string().optional(),
  skip_reason: z.string().optional(),
});

// User Profile Schemas
export const updateProfileSchema = z.object({
  chronotype: z.enum(['early_bird', 'night_owl', 'neutral']).optional(),
  personality_type: z.string().optional(),
  learning_style: z.string().optional(),
  work_hours_start: z.string().optional(),
  work_hours_end: z.string().optional(),
  deep_work_duration_min: z.number().min(15).max(180).optional(),
  motivators: z.array(z.string()).optional(),
  demotivators: z.array(z.string()).optional(),
  coach_style: z.enum(['tough', 'gentle', 'balanced']).optional(),
  notification_frequency: z.enum(['low', 'normal', 'high']).optional(),
});

// Decision Schemas
export const createDecisionSchema = z.object({
  title: z.string().min(1).max(200),
  context: z.string().max(2000).optional(),
  options: z.array(z.object({
    name: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  })).min(2),
  chosen_option: z.string().optional(),
  reasoning: z.string().max(2000).optional(),
  gut_feeling: z.number().min(1).max(10).optional(),
  review_date: z.string().optional(),
});

// Learning Schemas
export const createLearningSchema = z.object({
  category: z.string().optional(),
  what_worked: z.string().max(1000).optional(),
  what_didnt: z.string().max(1000).optional(),
  key_insight: z.string().min(1).max(1000),
  apply_to: z.array(z.string()).optional(),
});

// Export types from schemas
export type MorningCheckinInput = z.infer<typeof morningCheckinSchema>;
export type EveningReviewInput = z.infer<typeof eveningReviewSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type HabitLogInput = z.infer<typeof habitLogSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type CreateLearningInput = z.infer<typeof createLearningSchema>;

