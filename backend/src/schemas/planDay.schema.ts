/**
 * Zod Schemas für POST /plan/day
 * Gemäß Spezifikation in docs/api-plan-day.md
 */

import { z } from 'zod';

// ============================================
// Request Schemas
// ============================================

export const TaskPrioritySchema = z.enum(['high', 'medium', 'low']);

export const TaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: TaskPrioritySchema.optional(),
  estimatedMinutes: z.number().positive('Estimated minutes must be positive').optional(),
});

export const PlanDayRequestSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  tasks: z.array(TaskSchema).default([]),
});

// ============================================
// Response Schemas
// ============================================

export const TimeBlockTypeSchema = z.enum(['focus', 'break', 'meeting', 'routine', 'buffer']);

export const TimeBlockSchema = z.object({
  id: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  type: TimeBlockTypeSchema,
  taskId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
});

export const DayPlanSchema = z.object({
  date: z.string(),
  blocks: z.array(TimeBlockSchema),
  summary: z.string(),
  createdAt: z.string(),
});

export const PlanDayResponseSchema = z.object({
  success: z.literal(true),
  plan: DayPlanSchema,
});

// ============================================
// Inferred Types
// ============================================

export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type PlanDayRequest = z.infer<typeof PlanDayRequestSchema>;

export type TimeBlockType = z.infer<typeof TimeBlockTypeSchema>;
export type TimeBlock = z.infer<typeof TimeBlockSchema>;
export type DayPlan = z.infer<typeof DayPlanSchema>;
export type PlanDayResponse = z.infer<typeof PlanDayResponseSchema>;

