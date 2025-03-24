
import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from 'src/services/payment/payment.service';
import { Wallet, WalletSchema } from './schema/wallet.schema';
import { UserSchema } from 'src/user/Schema/user.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [WalletController],
  providers: [WalletService, PaymentService],
  exports: [WalletService], 
})
export class WalletModule {}