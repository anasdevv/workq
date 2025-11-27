import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { TokenPayload } from '../token-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => {
          console.log(
            'JwtStrategy token:',
            req?.cookies?.Authorization || req?.token
          );
          return req?.cookies?.Authorization || req?.token;
        },
      ]),
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  validate(payload: TokenPayload) {
    console.log('JwtStrategy payload:', payload);
    if (!payload || !payload.userId) {
      throw new Error('Invalid token payload');
    }
    return payload;
  }
}
