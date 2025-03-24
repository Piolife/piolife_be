import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type LoanRepaymentDocument = LoanRepayment & Document;

@Schema({ timestamps: true })
export class LoanRepayment {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  loanId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  totalPaid: number; 

  @Prop({ required: true })
  remainingBalance: number; 

  @Prop({ default: new Date() })
  repaymentDate: Date;
}

export const LoanRepaymentSchema = SchemaFactory.createForClass(LoanRepayment);
