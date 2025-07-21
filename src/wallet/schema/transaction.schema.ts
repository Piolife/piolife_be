import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Transaction extends Document {
  @Prop({ required: true })
  walletId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  transactionRef: string; 

  @Prop({ required: true })
  status: string; 
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
