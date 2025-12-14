/**
 * Request Logger Plugin für Fastify
 * 
 * Loggt alle eingehenden Requests mit:
 * - HTTP-Methode
 * - URL-Pfad
 * - Status-Code
 * - Response-Zeit
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

async function requestLoggerPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.log.info({
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
    }, 'Incoming request');
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'Request completed');
  });

  fastify.addHook('onError', async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
    request.log.error({
      method: request.method,
      url: request.url,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    }, 'Request error');
  });
}

export default fp(requestLoggerPlugin, {
  name: 'request-logger',
});

