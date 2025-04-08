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


@Module({
  imports: [
      forwardRef(() => WalletModule),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Wallet', schema: WalletSchema }]),
    CloudinaryModule,
    WalletModule,
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_secret_key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
