import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { Params } from 'nestjs-pino';
import type { Options } from 'pino-http';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: (configService: ConfigService): Params => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            ...(isProduction
              ? {}
              : {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      translateTime: 'SYS:standard',
                    },
                  },
                }),
          } as Options,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class LoggerModule {}
