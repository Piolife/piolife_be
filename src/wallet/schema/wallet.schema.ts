// wallet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';
const snowflakeIdGenerator = new SnowflakeIdGenerator();

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BANK_TRANSFER  ='bank_transfer',
  opay_transfer = 'opay_transfer',
}

interface Transaction {
  amount: number;
  timestamp: Date;
  type: TransactionType;
  payload?: any;
  reason?: string;
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
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

