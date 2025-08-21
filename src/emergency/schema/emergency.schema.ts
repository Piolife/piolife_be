import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type EmergencyStockDocument = EmergencyStock & Document;

@Schema()
export class EmergencyStock {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  ward: string;

  @Prop({ required: true })
  lga: string;

  @Prop({ required: true })
  natureOfIncident: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  services_amount: number;

  @Prop({ required: true })
  percentage_amount: number;

  @Prop({ type: String, ref: 'User', required: true })
  caller: string;

  @Prop({ type: String, ref: 'User', required: true })
  facility: string;
}

export const EmergencyStockSchema =
  SchemaFactory.createForClass(EmergencyStock);
