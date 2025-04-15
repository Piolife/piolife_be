import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  medicalPractitioner: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop()
  reason: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'MedicalIssue' }],
    required: true,
    default: [],
  })
  medicalIssue: Types.ObjectId[];

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'pending', enum: ['pending', 'in-progress', 'completed', 'cancelled'] })
  status: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
