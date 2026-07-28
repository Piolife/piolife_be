// wallet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';
const snowflakeIdGenerator = new SnowflakeIdGenerator();

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BANK_TRANSFER = 'bank_transfer',
  opay_transfer = 'opay_transfer',
  REFERRAL_BONUS = 'referral_bonus',
  CONSULTATION_FEE = 'consultation_fee',
  CONSULTATION_REFUND = 'consultation_refund',
  CONSULTATION_PAYMENT = 'consultation_payment',
  CONSULTATION_RESERVE = 'consultation_reserve',
  CONSULTATION_RELEASE = 'consultation_release',
  EMERGENCY_PAYMENT = 'emergency_payment',
  LOAN_DISBURSEMENT = 'loan_disbursement',
  LOAN_REPAYMENT = 'loan_repayment',
  STOCK_PURCHASE = 'stock_purchase',
  LAB_TEST_PAYMENT = 'LAB_TEST_PAYMENT',
  LAB_TEST_REVENUE = 'LAB_TEST_REVENUE',
  STOCK_SALE = 'STOCK_SALE',
}

interface Reservation {
  consultationId: string;
  amount: number;
  createdAt: Date;
}

interface Transaction {
  amount: number;
  timestamp?: Date;
  type: TransactionType;
  payload?: any;
  reason?: string;
  description?: string;
}

export type WalletDocument = Wallet & Document;

@Schema()
export class Wallet {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;
  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop()
  userId: string;

  @Prop({ type: [Object] })
  transactions: Transaction[];

  @Prop({ default: 20000, min: 0 })
  loanEligibility: number;

  @Prop({ type: Number, default: 0 })
  loanBalance: number;

  // Funds locked for pending consultations (not yet paid, not yet released)
  @Prop({ type: Number, default: 0 })
  reserved: number;

  @Prop({ type: [Object], default: [] })
  reservations: Reservation[];
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
