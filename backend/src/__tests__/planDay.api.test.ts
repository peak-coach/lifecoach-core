/**
 * API Integration Tests für POST /plan/day
 * 
 * Testet den Endpoint End-to-End mit dem Fastify-Server im Test-Kontext.
 * Gemäß Spezifikation in docs/api-plan-day.md
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestServer, testHelpers } from './testServer.js';

describe('POST /plan/day', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildTestServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  // ===================================================
  // Success Cases
  // ===================================================
  describe('successful responses', () => {
    it('should return 200 with a valid request containing tasks', async () => {
      const requestBody = testHelpers.createPlanDayRequest({
        date: '2025-11-28',
        tasks: [
          {
            id: 'task-1',
            title: 'Führerschein lernen Theorie',
            priority: 'high',
            estimatedMinutes: 60,
          },
          {
            id: 'task-2',
            title: 'Training: Kraft & Mobility',
            priority: 'medium',
            estimatedMinutes: 45,
          },
        ],
      });

      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.plan).toBeDefined();
      expect(body.plan.date).toBe('2025-11-28');
      expect(body.plan.blocks).toBeInstanceOf(Array);
      expect(body.plan.blocks.length).toBeGreaterThan(0);
      expect(body.plan.summary).toBeDefined();
      expect(body.plan.createdAt).toBeDefined();
    });

    it('should return 200 with empty tasks array', async () => {
      const requestBody = testHelpers.createEmptyPlanDayRequest('2025-11-28');

      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.plan.blocks).toBeInstanceOf(Array);
      // Sollte mindestens Morning Routine und Evening Review haben
      expect(body.plan.blocks.length).toBeGreaterThanOrEqual(2);
    });

    it('should include Morning Routine and Evening Review blocks', async () => {
      const requestBody = testHelpers.createEmptyPlanDayRequest();

      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: requestBody,
      });

      const body = JSON.parse(response.body);
      const blocks = body.plan.blocks;

      const morningRoutine = blocks.find(
        (b: { type: string; title: string }) => b.type === 'routine' && b.title === 'Morning Routine'
      );
      const eveningReview = blocks.find(
        (b: { type: string; title: string }) => b.type === 'routine' && b.title === 'Evening Review'
      );

      expect(morningRoutine).toBeDefined();
      expect(morningRoutine.startTime).toBe('08:00');
      expect(eveningReview).toBeDefined();
      expect(eveningReview.startTime).toBe('20:00');
    });

    it('should create focus blocks for each task', async () => {
      const requestBody = testHelpers.createPlanDayRequest({
        tasks: [
          { id: 'task-1', title: 'Task One', priority: 'high', estimatedMinutes: 60 },
          { id: 'task-2', title: 'Task Two', priority: 'low', estimatedMinutes: 30 },
        ],
      });

      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: requestBody,
      });

      const body = JSON.parse(response.body);
      const focusBlocks = body.plan.blocks.filter(
        (b: { type: string }) => b.type === 'focus'
      );

      expect(focusBlocks.length).toBe(2);
      expect(focusBlocks.some((b: { taskId: string }) => b.taskId === 'task-1')).toBe(true);
      expect(focusBlocks.some((b: { taskId: string }) => b.taskId === 'task-2')).toBe(true);
    });
  });

  // ===================================================
  // Block Structure Validation
  // ===================================================
  describe('block structure', () => {
    it('should return blocks with all required fields', async () => {
      const requestBody = testHelpers.createPlanDayRequest();

      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: requestBody,
      });

      const body = JSON.parse(response.body);
      
      body.plan.blocks.forEach((block: Record<string, unknown>) => {
        expect(block).toHaveProperty('id');
        expect(block).toHaveProperty('startTime');
        expect(block).toHaveProperty('endTime');
        expect(block).toHaveProperty('type');
        expect(block).toHaveProperty('title');
        
        // Time format validation
        expect(block.startTime).toMatch(/^\d{2}:\d{2}$/);
        expect(block.endTime).toMatch(/^\d{2}:\d{2}$/);
        
        // Type validation
        expect(['focus', 'break', 'routine', 'meeting', 'buffer']).toContain(block.type);
      });
    });

    it('should return focus blocks with taskId referencing input tasks', async () => {
      const requestBody = testHelpers.createPlanDayRequest({
        tasks: [
          { id: 'my-unique-task-id', title: 'Special Task', estimatedMinutes: 45 },
        ],
      });

      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: requestBody,
      });

      const body = JSON.parse(response.body);
      const focusBlock = body.plan.blocks.find(
        (b: { type: string }) => b.type === 'focus'
      );

      expect(focusBlock).toBeDefined();
      expect(focusBlock.taskId).toBe('my-unique-task-id');
      expect(focusBlock.title).toBe('Special Task');
    });
  });

  // ===================================================
  // Validation Error Cases (422)
  // ===================================================
  describe('validation errors', () => {
    it('should return 422 when date format is invalid', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: {
          date: '28-11-2025', // Wrong format
          tasks: [],
        },
      });

      expect(response.statusCode).toBe(422);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation Error');
    });

    it('should return 422 when date is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: {
          tasks: [],
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it('should return 422 when task is missing required id', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: {
          date: '2025-11-28',
          tasks: [
            { title: 'Task without ID' },
          ],
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it('should return 422 when task is missing required title', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: {
          date: '2025-11-28',
          tasks: [
            { id: 'task-1' },
          ],
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it('should return 422 when priority is invalid', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: {
          date: '2025-11-28',
          tasks: [
            { id: 'task-1', title: 'Task', priority: 'urgent' }, // Invalid priority
          ],
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it('should return 422 when estimatedMinutes is negative', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: {
          date: '2025-11-28',
          tasks: [
            { id: 'task-1', title: 'Task', estimatedMinutes: -30 },
          ],
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });

  // ===================================================
  // Edge Cases
  // ===================================================
  describe('edge cases', () => {
    it('should handle tasks without optional fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: {
          date: '2025-11-28',
          tasks: [
            { id: 'task-1', title: 'Minimal Task' },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should handle many tasks gracefully', async () => {
      const manyTasks = Array.from({ length: 20 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        estimatedMinutes: 30,
      }));

      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: {
          date: '2025-11-28',
          tasks: manyTasks,
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.plan.blocks.length).toBeGreaterThan(0);
    });

    it('should return correct Content-Type header', async () => {
      const requestBody = testHelpers.createEmptyPlanDayRequest();

      const response = await server.inject({
        method: 'POST',
        url: '/plan/day',
        payload: requestBody,
      });

      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});


