import * as request from 'supertest';
import { TestApp } from './interfaces/test-app.interface';
import { createTestApp } from './utils/createTestApp';

describe('AppController (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', async () => {
    return await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
