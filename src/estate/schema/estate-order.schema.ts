/**
 * estate-order.schema.ts — NEW
 * Stores Pioland property purchase agreements and instalment records.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();
export type EstateOrderDocument = EstateOrder & Document;

@Schema({ timestamps: true })
export class EstateOrder {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  plotNumber: string;

  @Prop({ required: true })
  estateName: string;

  @Prop({ required: true })
  state: string;

  @Prop()
  lga: string;

  @Prop()
  ward: string;

  @Prop({ required: true })
  propertyValue: number;

  @Prop({ enum: ['instalment', 'outright'], default: 'instalment' })
  paymentType: string;

  @Prop()
  instalmentAmount: number;

  // Running tracker fields (updated on each payment)
  @Prop({ default: 0 })
  totalPaid: number;

  @Prop()
  balance: number;

  @Prop({ default: 1 })
  timesPaid: number;

  @Prop()
  lastPaymentDate: Date;

  @Prop()
  nextDueDate: Date;

  @Prop({ default: 0 })
  totalDefaultCharges: number;

  @Prop({ default: 0 })
  defaultCounter: number;

  @Prop({ default: 0 })
  straightDefaultCounter: number;

  @Prop({ default: false })
  revoked: boolean;

  @Prop({ default: false })
  completed: boolean;

  @Prop()
  officialName: string;

  @Prop()
  email: string;

  @Prop()
  matricNumber: string;

  @Prop()
  institution: string;

  @Prop()
  agreementDate: Date;

  @Prop({ enum: ['student', 'pioland', 'luxury'], default: 'pioland' })
  category: string;
}

export const EstateOrderSchema = SchemaFactory.createForClass(EstateOrder);
