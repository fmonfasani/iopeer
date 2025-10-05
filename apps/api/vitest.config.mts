import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      enabled: true,
      include: [
        'src/runs/**/*.ts',
        'src/health/**/*.ts',
        'src/metrics/**/*.ts',
        'src/steps/http.ts',
      ],
      exclude: [
        '**/src/app.controller.ts',
        '**/src/app.service.ts',
        '**/src/app.module.ts',
        '**/src/main.ts',
        '**/src/gates/**',
        '**/src/logger/**',
        '**/src/middleware/**',
        '**/src/scheduler/**',
        '**/src/steps/echo.ts',
        '**/src/steps/delay.ts',
        '**/src/steps/registry.ts',
      ],
    },
  },
});
