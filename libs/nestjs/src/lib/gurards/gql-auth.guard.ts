import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { catchError, map, Observable, of } from 'rxjs';
import { AUTH_PACKAGE_NAME, AuthServiceClient } from 'types/proto/auth';
import { ClientGrpc } from '@nestjs/microservices';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard implements CanActivate, OnModuleInit {
  private authService: AuthServiceClient;
  private readonly logger = new Logger(GqlAuthGuard.name);
  constructor(@Inject(AUTH_PACKAGE_NAME) private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const token = this.getRequest(context).cookies?.Authentication;
    if (!token) {
      return false;
    }
    return this.authService
      .authenticate({
        token,
      })
      .pipe(
        map((response) => {
          this.logger.log('response ', response);
          this.getRequest(context).user = response;
          return true;
        }),
        catchError((err) => {
          this.logger.error('err ', err);
          return of(false);
        })
      );
  }

  private getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
