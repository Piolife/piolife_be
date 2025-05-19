import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as dotenv from 'dotenv';

dotenv.config(); 

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secretOrKey: process.env.JWT_SECRET || '',
      secretOrKey: "3tx54kqrmtyuufbdrv66en3htwr6xh5gfwsh65jkuvat7dyrsqrbn945wq4gkqf6",
    });
  }

  async validate(payload: any) {
    return payload;
    }
}
