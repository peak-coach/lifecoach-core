import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only include files ending with .test.ts
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    // Use threads pool to avoid tinypool fork recursion issues
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/index.ts'],
    },
    // Set test environment
    env: {
      NODE_ENV: 'test',
    },
  },
});

