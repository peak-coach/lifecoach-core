/**
 * Health Controller
 * 
 * System-Endpunkte für Health Checks und Status-Abfragen
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HealthResponse } from '../types/index.js';

const startTime = Date.now();
const version = process.env.npm_package_version || '0.1.0';

/**
 * GET /health
 * 
 * Health Check Endpoint für Container-Orchestrierung und Monitoring.
 * Gibt den aktuellen Status, Version und Uptime zurück.
 */
export async function healthCheck(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  reply.status(200).send(response);
}
