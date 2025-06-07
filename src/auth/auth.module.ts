import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      // secret: process.env.JWT_SECRET,
      secret: "uzd3477hg4w2tmd7qp9zcc5yex9wvg66pambdazuqf9fb5b32szfgrqra7429vst",
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [ JwtStrategy],
  exports: [ JwtModule],
})
export class AuthModule {}
