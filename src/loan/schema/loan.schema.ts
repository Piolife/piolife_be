import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';
const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type LoanDocument = Loan & Document;

@Schema({ timestamps: true })
export class Loan {

        @Prop({
            type: String,
            default: () => snowflakeIdGenerator.generate(),
            required: true,
          })
          _id: string;
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected', 'paid'] })
  status: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ default: 0 })
  interestRate: number;

  @Prop()
  createdAt:Date
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
