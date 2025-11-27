require('module-alias/register');

import { NestFactory } from '@nestjs/core';
import { init } from '@workq/nestjs';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  await init(app);
}

bootstrap();
