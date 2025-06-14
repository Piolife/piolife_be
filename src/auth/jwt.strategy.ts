import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv';

dotenv.config(); 

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'uzd3477hg4w2tmd7qp9zcc5yex9wvg66pambdazuqf9fb5b32szfgrqra7429vst',
    });
  }
  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}

