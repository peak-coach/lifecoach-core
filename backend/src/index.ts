/**
 * LifeCoach Core API - Entry Point
 * 
 * Fastify-Server mit REST-API für das LifeCoach-System.
 * Gemäß Architektur in docs/architecture.md
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config/env.js';
import logger from './lib/logger.js';
import { errorHandler } from './lib/errors.js';
import registerRoutes from './routes/index.js';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.isDev ? 'debug' : 'info',
      transport: config.isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // Global Error Handler
  fastify.setErrorHandler(errorHandler);

  // Request Logging Hook
  fastify.addHook('onResponse', (request, reply, done) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: Math.round(reply.elapsedTime),
    }, 'Request completed');
    done();
  });

  // Security & CORS
  await fastify.register(cors, {
    origin: config.isDev ? true : false,
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: config.isProd,
  });

  // Routes
  await registerRoutes(fastify);

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();

    await server.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('  🚀 LifeCoach Core API v0.1.0');
    logger.info(`  📍 Environment: ${config.nodeEnv}`);
    logger.info(`  🔌 Port: ${config.port}`);
    logger.info(`  🤖 LLM Provider: ${config.llm.provider}`);
    logger.info('───────────────────────────────────────────────────────────');
    logger.info('  Available Endpoints:');
    logger.info('  GET  /health          → Health Check');
    logger.info('  POST /plan/day        → Generate Day Plan');
    logger.info('  POST /execution/event → Track Execution Event');
    logger.info('  POST /review/day      → Generate Day Review');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful Shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

start();
