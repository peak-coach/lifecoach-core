/**
 * LifeCoach Core API - Validation Utilities
 * 
 * Hilfsfunktionen für Zod-basierte Request-Validierung
 */

import { z, ZodSchema } from 'zod';
import { fromZodError } from './errors.js';

/**
 * Validiert Daten gegen ein Zod-Schema.
 * Wirft einen ValidationError bei ungültigen Daten.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw fromZodError(result.error);
  }
  
  return result.data;
}

/**
 * Validiert Daten und gibt ein Ergebnis-Objekt zurück (ohne Exception)
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

/**
 * Validiert ein Datum im Format YYYY-MM-DD
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validiert eine Zeit im Format HH:MM
 */
export function isValidTime(timeString: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
}

