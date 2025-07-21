import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './Schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { CloudinaryModule } from 'src/services/cloudinary/cloudinary.module';
import { EmailModule } from 'src/services/email/email.module';
import { WalletSchema } from 'src/wallet/schema/wallet.schema';
import { WalletModule } from 'src/wallet/wallet.module';
import { PresenceGateway } from './presence.gateway';
import { CacheModule } from '@nestjs/cache-manager';



@Module({
  imports: [
    CacheModule.register({
      isGlobal: true, 
    }),
      forwardRef(() => WalletModule),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Wallet', schema: WalletSchema }]),
    CloudinaryModule,
    WalletModule,
    EmailModule,
    JwtModule.register({
      secret: "uzd3477hg4w2tmd7qp9zcc5yex9wvg66pambdazuqf9fb5b32szfgrqra7429vst",
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [UserController],
  providers: [PresenceGateway,UserService],
  exports: [UserService],
})
export class UserModule {}
