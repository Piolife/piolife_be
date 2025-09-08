import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedLabStock, MedLabStockSchema } from './schema/medlab-stock.schema';
import { MedLabStockController } from './medlab-stock.controller';
import { Wallet, WalletSchema } from 'src/wallet/schema/wallet.schema';
import { MedLabStockService } from './medlab-stock.service';
import { WalletModule } from 'src/wallet/wallet.module';
import { MedLabOrder, MedLabOrderSchema } from './schema/laborder.schema';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    MongooseModule.forFeature([
      { name: MedLabStock.name, schema: MedLabStockSchema },
      { name: MedLabOrder.name, schema: MedLabOrderSchema },
    ]),
    WalletModule,
  ],
  controllers: [MedLabStockController],
  providers: [MedLabStockService],
})
export class MedLabStockModule {}
