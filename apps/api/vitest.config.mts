import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reports: ['text', 'html', 'json-summary'],
      thresholds: { lines: 70, statements: 70, functions: 70, branches: 70 },
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.spec.ts',
        '**/*.e2e-spec.ts',
        'node_modules/**',
        'dist/**',
        'test/**',
        'src/main.ts',
        'src/middleware/**',
      ],
    },
  },
});
