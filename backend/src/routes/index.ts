/**
 * Route Registration
 * 
 * Zentrale Registrierung aller API-Routes
 */

import type { FastifyInstance } from 'fastify';
import healthRoutes from './health.js';
import planRoutes from './plan.js';
import executionRoutes from './execution.js';
import reviewRoutes from './review.js';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // System Routes
  await fastify.register(healthRoutes);

  // Business Routes
  await fastify.register(planRoutes);
  await fastify.register(executionRoutes);
  await fastify.register(reviewRoutes);
}

export default registerRoutes;
