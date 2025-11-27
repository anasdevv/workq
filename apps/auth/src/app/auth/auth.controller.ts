import { Controller, UseGuards, UseInterceptors } from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  AuthenticateRequest,
  AuthServiceController,
  AuthServiceControllerMethods,
  User,
} from 'libs/grpc/src/lib/types/proto/auth';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { TokenPayload } from './token-payload.interface';
import { GrpcLoggerInterceptor } from '@workq/grpc';

@Controller()
@AuthServiceControllerMethods()
@UseInterceptors(GrpcLoggerInterceptor)
export class AuthController implements AuthServiceController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  authenticate(
    request: AuthenticateRequest & { user: TokenPayload }
  ): Promise<User> | Observable<User> | User {
    console.log('request AuthServiceControllerMethods ', request);
    return this.usersService.getUser({ id: request.user.userId });
  }
}
