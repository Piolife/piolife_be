import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// import { UserModule } from './user/user.module';
// import { EmailModule } from './services/email.module';
// import { EmailService } from './services/email.service';
import { APP_PIPE } from '@nestjs/core';
// import { CloudinaryModule } from './cloudinary/cloudinary.module';
import * as cloudinary from 'cloudinary';
// import { NotificationModule } from './notification/notification.module';
// import { ContentModule } from './content/content.module';
// import { ChatModule } from './chat/chat.module';
// import { PersonalGroupChatModule } from './personal-group-chat/personal-group-chat.module';
// import { SearchModule } from './search/search.module';
// import { ScheduleModule } from '@nestjs/schedule';
// import { RenderService } from './render-service/render-service';
// import { PaymentModule } from './payment/payment.module';
// import { WithdrawalModule } from './withdrawal/withdrawal.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { LoanModule } from './loan/loan.module';

@Module({
  imports: [
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