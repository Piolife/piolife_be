import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, SchemaTypes } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ required: true }) sessionId: string;

  @Prop({ required: true }) userId: string;

  @Prop({ required: true }) practitionerId: string;

  @Prop({ required: true }) rating: number;

  @Prop({ required: true }) review: string;

  // 🛠 Fix ambiguous type
  @Prop({ type: SchemaTypes.Mixed })
  diagnose: any;

  @Prop({ type: SchemaTypes.Mixed })
  prescribed: any;

  @Prop()
  referral: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
