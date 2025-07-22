import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type PharmacyStockDocument = PharmacyStock & Document;

@Schema()
export class PharmacyStock {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  image: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: String, ref: 'User', required: true })
  user: string;

  @Prop({
    type: String,
    enum: ['AVAILABLE', 'OUT_OF_STOCK'],
    default: 'AVAILABLE',
  })
  status: string;
}

export const PharmacyStockSchema = SchemaFactory.createForClass(PharmacyStock);

// Optional: Automatically update status when quantity changes
PharmacyStockSchema.pre('save', function (next) {
  const stock = this as PharmacyStockDocument;
  if (stock.quantity === 0) {
    stock.status = 'OUT_OF_STOCK';
  } else {
    stock.status = 'AVAILABLE';
  }
  next();
});
