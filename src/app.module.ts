import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_PIPE } from '@nestjs/core';
import * as cloudinary from 'cloudinary';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { UserModule } from './user/user.module';
import { LoanModule } from './loan/loan.module';
import { MedicalIssuesModule } from './medical-issues/medical-issues.module';
import { SessionsModule } from './sessions/sessions.module';
import { PharmacyStockModule } from './pharmacy-stock/pharmacy-stock.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
       CacheModule.register({
          isGlobal: true, 
        }),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => {
        console.log('server connected');
        return {
          uri: process.env.MONGODB_URL,
        };
      },
    }),
    UserModule,
    AuthModule,
    WalletModule,
    LoanModule,
    MedicalIssuesModule,
    SessionsModule,
    PharmacyStockModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {
  constructor() {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}