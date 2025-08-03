import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';

export interface TestApp {
  app: INestApplication;
  getHttpServer: () => App;
  close: () => Promise<void>;
}
