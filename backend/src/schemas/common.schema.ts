/**
 * Common Schemas
 * Wiederverwendbare Schemas für API-Responses
 */

import { z } from 'zod';

// ============================================
// Error Response Schema
// ============================================

export const ApiErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
});

export const ApiErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
  details: z.array(ApiErrorDetailSchema).optional(),
});

// ============================================
// Health Response Schema
// ============================================

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string(),
  version: z.string(),
  uptime: z.number(),
  environment: z.string().optional(),
});

// ============================================
// Inferred Types
// ============================================

export type ApiErrorDetail = z.infer<typeof ApiErrorDetailSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

