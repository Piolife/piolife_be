/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from 'src/wallet/schema/wallet.schema';
import {
  EmergencyStock,
  EmergencyStockSchema,
} from './schema/emergency.schema';
import { EmergencyStockController } from './emergency.controller';
import { EmergencyStockService } from './emergency.service';
import { User, UserSchema } from 'src/user/Schema/user.schema';
import { WalletModule } from 'src/wallet/wallet.module';
import { StreamModule } from 'src/stream/stream.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: EmergencyStock.name, schema: EmergencyStockSchema },
      { name: User.name, schema: UserSchema }, // ✅ So you can fetch providers
    ]),
    WalletModule,
    StreamModule, // ✅ Makes WalletService available
  ],
  controllers: [EmergencyStockController],
  providers: [EmergencyStockService],
})
export class EmergencyStockModule {}
