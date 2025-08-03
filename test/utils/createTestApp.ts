import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { TestApp } from 'test/interfaces/test-app.interface';

export async function createTestApp(): Promise<TestApp> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication<App> = moduleFixture.createNestApplication();
  await app.init();

  return {
    app,
    getHttpServer: () => app.getHttpServer(),
    close: () => app.close(),
  };
}
