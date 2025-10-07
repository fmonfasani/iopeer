import { Prisma } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunsService } from '../../src/runs/runs.service';
import { createTestingApp } from '../factories';
import { RUN_STATUS } from '../../src/runs/run-status';

describe('AppModule E2E', () => {
  let app: INestApplication;
  let runsService: RunsService;
  let request: import('supertest').SuperTest<import('supertest').Test>;
  let runStore: Map<string, any>;

  beforeAll(async () => {
    const created = await createTestingApp();
    app = created.app;
    runsService = app.get(RunsService);
    request = created.request;
    runStore = created.runStore;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / responds with Hello World', async () => {
    const res = await request.get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello World!');
  });

  it('GET /health returns health payload', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
    expect(() => new Date(res.body.ts)).not.toThrow();
  });

  it('POST /runs queues and processes a run', async () => {
    const res = await request
      .post('/runs')
      .send({ workflowId: 'wf-e2e', nodes: [{ id: 'n1', type: 'echo' }] });

    expect([200, 201]).toContain(res.status);
    const runId = res.body.id;
    expect(runId).toBeDefined();

    await (runsService as any).processNext();
    await new Promise((resolve) => setImmediate(resolve));

    const storedRun = runStore.get(runId);
    expect(storedRun.status).toBe(RUN_STATUS.SUCCESS);
    expect(storedRun.log.stepLogs).toHaveLength(1);
  });
});
