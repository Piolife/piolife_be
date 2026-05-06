import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/Schema/user.schema';

import {
  PharmacyStock,
  PharmacyStockSchema,
} from './schema/pharmacy-stock.schema';
// import { PharmacyStocksService } from './pharmacy-stock.service';
// import { PharmacyStocksController } from './pharmacy-stock.controller';
import { PharmacyStockService } from './pharmacy-stock.service';
import { PharmacyStockController } from './pharmacy-stock.controller';
import { Wallet, WalletSchema } from 'src/wallet/schema/wallet.schema';
import {
  PharmacySale,
  PharmacySaleSchema,
} from './schema/pharmacyOrder.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PharmacyStock.name, schema: PharmacyStockSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: PharmacySale.name, schema: PharmacySaleSchema },
    ]),
  ],
  controllers: [PharmacyStockController],
  providers: [PharmacyStockService],
})
export class PharmacyStockModule {}
