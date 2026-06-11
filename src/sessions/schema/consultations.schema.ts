import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type ConsultationsDocument = Consultations & Document;

@Schema({ timestamps: true })
export class Consultations {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @Prop({ type: String, ref: 'User' })
  practitionerId?: string;

  @Prop({ type: String, ref: 'MedicalIssue' })
  medicalIssueId?: string;

  @Prop({ type: [String], default: undefined })
  issues?: string[];

  @Prop({ type: [String], default: undefined })
  issueIds?: string[];

  @Prop({ type: String })
  callType?: string;

  @Prop({ type: String })
  language?: string;

  @Prop({ type: Number })
  amount?: number;

  @Prop({ default: 'pending' })
  status: string;
}

export const ConsultationsSchema = SchemaFactory.createForClass(Consultations);
