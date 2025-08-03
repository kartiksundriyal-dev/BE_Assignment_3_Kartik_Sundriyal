import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_PORT } from './config/constants';
import { ConsoleLogger } from '@nestjs/common';

const logger = new ConsoleLogger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? APP_PORT);
}

bootstrap().catch((err) => {
  logger.error('Application failed to start:', err);
  process.exit(1);
});
