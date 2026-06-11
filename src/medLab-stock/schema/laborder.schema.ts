import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type MedLabOrderDocument = MedLabOrder & Document;

@Schema({ timestamps: true })
export class MedLabOrder {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  medLabId: string;

  @Prop({ type: [String], required: true })
  testIds: string[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  diagnosisNote?: string;
}

export const MedLabOrderSchema = SchemaFactory.createForClass(MedLabOrder);
