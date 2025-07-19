import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PharmacyStock, PharmacyStockSchema } from './schema/pharmacy-stock.schema';
// import { PharmacyStocksService } from './pharmacy-stock.service';
// import { PharmacyStocksController } from './pharmacy-stock.controller';
import { PharmacyStockService } from './pharmacy-stock.service';
import { PharmacyStockController } from './pharmacy-stock.controller';
import { Wallet, WalletSchema } from 'src/wallet/schema/wallet.schema';

@Module({
  imports: [
       MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    MongooseModule.forFeature([{ name: PharmacyStock.name, schema: PharmacyStockSchema }]),
  ],
  controllers: [PharmacyStockController],
  providers: [PharmacyStockService],
})
export class PharmacyStockModule {}
