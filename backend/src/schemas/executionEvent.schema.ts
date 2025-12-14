/**
 * Zod Schemas für POST /execution/event
 * Gemäß Spezifikation in docs/api-execution-event.md
 */

import { z } from 'zod';

// ============================================
// Request Schemas
// ============================================

export const ExecutionActionSchema = z.enum(['started', 'completed', 'skipped', 'paused']);

export const ExecutionEventRequestSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  blockId: z.string().min(1, 'Block ID is required'),
  action: ExecutionActionSchema,
  timestamp: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// ============================================
// Response Schemas
// ============================================

export const ExecutionEventResponseSchema = z.object({
  success: z.literal(true),
  event: z.object({
    date: z.string(),
    blockId: z.string(),
    action: ExecutionActionSchema,
    processedAt: z.string(),
  }),
  nextSuggestedAction: z.string().optional(),
});

// ============================================
// Inferred Types
// ============================================

export type ExecutionAction = z.infer<typeof ExecutionActionSchema>;
export type ExecutionEventRequest = z.infer<typeof ExecutionEventRequestSchema>;
export type ExecutionEventResponse = z.infer<typeof ExecutionEventResponseSchema>;

