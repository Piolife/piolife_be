import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      // secret: process.env.JWT_SECRET,
      secret: "3tx54kqrmtyuufbdrv66en3htwr6xh5gfwsh65jkuvat7dyrsqrbn945wq4gkqf6",
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [ JwtStrategy],
  exports: [ JwtModule],
})
export class AuthModule {}
