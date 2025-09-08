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

  @Prop({ type: String, ref: 'User', required: true })
  practitionerId: string;

  @Prop({ type: String, ref: 'MedicalIssue', required: true })
  medicalIssueId: string;

  @Prop({ default: 'pending' })
  status: string;
}

export const ConsultationsSchema = SchemaFactory.createForClass(Consultations);
