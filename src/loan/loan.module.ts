import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { Loan, LoanSchema } from './schema/loan.schema';
import { WalletModule } from 'src/wallet/wallet.module';
import { UserSchema } from 'src/user/Schema/user.schema';
import { Wallet, WalletSchema } from 'src/wallet/schema/wallet.schema';
import { LoanRepayment, LoanRepaymentSchema } from './schema/loanRepayment.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Loan.name, schema: LoanSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
      MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
      MongooseModule.forFeature([{ name: LoanRepayment.name, schema: LoanRepaymentSchema }]),
  WalletModule,],
  
  controllers: [LoanController],
  providers: [LoanService],
})
export class LoanModule {}
