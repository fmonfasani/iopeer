import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('E2E API', () => {
  let app: INestApplication;
  let http: request.SuperTest<request.Test>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer();
    http = request(server);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health debe responder ok', async () => {
    const res = await http.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /runs/test crea un run', async () => {
    const res = await http.post('/runs/test').send({});
    expect(res.status).toBe(
      201 /* Nest por default puede devolver 201 */ || 200,
    );
    expect(res.body?.id).toBeDefined();
  });

  it('POST /scheduler/next dispara un tick', async () => {
    const res = await http.post('/scheduler/next').send({});
    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBe(true);
  });
});
