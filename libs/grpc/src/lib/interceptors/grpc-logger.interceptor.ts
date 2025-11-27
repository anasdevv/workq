import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class GrpcLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const ctx = context.switchToRpc();
    const handler = context.getHandler().name;
    const args = context.getArgs()[0];
    const request = ctx.getData();
    const requestId = uuidv4();

    this.logger.log({
      requestId,
      handler,
      args,
      request,
      message: `gRPC request - Method: ${handler}, Request ID: ${requestId}`,
    });

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - now;
        this.logger.log({
          requestId,
          handler,
          response,
          duration,
          message: `gRPC response - Method: ${handler}, Request ID: ${requestId}, Duration: ${duration}ms`,
        });
      })
    );
  }
}
