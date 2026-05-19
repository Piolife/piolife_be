import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstateController } from './estate.controller';
import { EstateService } from './estate.service';
import { EstateOrder, EstateOrderSchema } from './schema/estate-order.schema';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EstateOrder.name, schema: EstateOrderSchema },
    ]),
    WalletModule,
  ],
  controllers: [EstateController],
  providers: [EstateService],
  exports: [EstateService],
})
export class EstateModule {}
