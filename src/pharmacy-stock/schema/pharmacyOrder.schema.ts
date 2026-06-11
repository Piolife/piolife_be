import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type PharmacySaleDocument = PharmacySale & Document;

@Schema({ timestamps: true })
export class PharmacySale {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ required: true })
  userId: string; // buyer

  @Prop({ required: true })
  practitionerId: string; // seller (pharmacy owner)

  @Prop({
    type: [
      {
        stockId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    required: true,
  })
  items: {
    stockId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 'completed' })
  status: string;

  @Prop()
  withDelivery?: boolean;

  @Prop()
  prescriptionId?: string;
}

export const PharmacySaleSchema = SchemaFactory.createForClass(PharmacySale);
