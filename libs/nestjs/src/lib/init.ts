import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';

export async function init(app: INestApplication) {
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    })
  );
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  const port = app.get(ConfigService).getOrThrow('PORT') || 3000;
  await app.listen(port);
  app
    .get(Logger)
    .log(
      `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
    );
}
