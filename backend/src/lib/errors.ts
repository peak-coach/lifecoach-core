/**
 * LifeCoach Core API - Error Handling Utilities
 * 
 * Einheitliche Fehler-Responses gemäß API-Spezifikation
 */

import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import type { ApiError } from '../types/index.js';

/**
 * Custom Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details?: { field?: string; message: string }[];

  constructor(
    statusCode: number,
    error: string,
    message: string,
    details?: { field?: string; message: string }[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Bad Request (400) - Allgemeine Fehler im Request-Format
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: { field?: string; message: string }[]) {
    super(400, 'Bad Request', message, details);
    this.name = 'BadRequestError';
  }
}

/**
 * Validation Error (422) - Schema-Validierungsfehler
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: { field?: string; message: string }[]) {
    super(422, 'Validation Error', message, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not Found (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'Not Found', message);
    this.name = 'NotFoundError';
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred') {
    super(500, 'Internal Server Error', message);
    this.name = 'InternalError';
  }
}

/**
 * Konvertiert einen Zod-Fehler in ein ValidationError
 */
export function fromZodError(error: ZodError): ValidationError {
  const details = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  
  return new ValidationError('Request validation failed', details);
}

/**
 * Formatiert einen Fehler als API-Response
 */
export function formatErrorResponse(error: AppError | Error): ApiError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      error: error.error,
      message: error.message,
      details: error.details,
    };
  }

  // Unbekannter Fehler -> 500
  return {
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  };
}

/**
 * Sendet eine Fehler-Response
 */
export function sendError(reply: FastifyReply, error: AppError | Error): void {
  const response = formatErrorResponse(error);
  reply.status(response.statusCode).send(response);
}

/**
 * Error Handler für Fastify (global)
 */
export function errorHandler(
  error: Error,
  _request: unknown,
  reply: FastifyReply
): void {
  // Zod Validation Errors
  if (error instanceof ZodError) {
    sendError(reply, fromZodError(error));
    return;
  }

  // Unsere eigenen AppErrors
  if (error instanceof AppError) {
    sendError(reply, error);
    return;
  }

  // Fastify Validation Errors (falls Fastify-Schema verwendet wird)
  if ('validation' in error && Array.isArray((error as { validation: unknown[] }).validation)) {
    const validationError = new ValidationError('Request validation failed');
    sendError(reply, validationError);
    return;
  }

  // Alle anderen Fehler -> 500
  console.error('Unhandled error:', error);
  sendError(reply, new InternalError());
}

