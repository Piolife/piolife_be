import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type MedLabStockDocument = MedLabStock & Document;

@Schema()
export class MedLabStock {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: String, ref: 'User', required: true })
  user: string;
}

export const MedLabStockSchema = SchemaFactory.createForClass(MedLabStock);
