/**
 * Zod Schemas für POST /review/day
 * Gemäß Spezifikation in docs/api-review-day.md
 */

import { z } from 'zod';

// ============================================
// Request Schemas
// ============================================

export const DaySummarySchema = z.object({
  plannedBlocks: z.number().optional(),
  completedBlocks: z.number().optional(),
  skippedBlocks: z.number().optional(),
});

export const ReviewDayRequestSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  daySummary: DaySummarySchema.optional(),
  completedTaskIds: z.array(z.string()).optional(),
  skippedTaskIds: z.array(z.string()).optional(),
  mood: z.number().min(1).max(10).optional(),
  energy: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

// ============================================
// Response Schemas
// ============================================

export const ReviewQuestionTypeSchema = z.enum(['text', 'scale', 'choice']);

export const ReviewQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: ReviewQuestionTypeSchema,
  options: z.array(z.string()).optional(),
});

export const ReviewDayResponseSchema = z.object({
  success: z.literal(true),
  summary: z.string(),
  questions: z.array(ReviewQuestionSchema),
  insights: z.array(z.string()).optional(),
  createdAt: z.string(),
});

// ============================================
// Inferred Types
// ============================================

export type DaySummary = z.infer<typeof DaySummarySchema>;
export type ReviewDayRequest = z.infer<typeof ReviewDayRequestSchema>;

export type ReviewQuestionType = z.infer<typeof ReviewQuestionTypeSchema>;
export type ReviewQuestion = z.infer<typeof ReviewQuestionSchema>;
export type ReviewDayResponse = z.infer<typeof ReviewDayResponseSchema>;

