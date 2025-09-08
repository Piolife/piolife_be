import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type PrescriptionDocument = Prescription & Document;

@Schema({ timestamps: true })
export class Prescription {
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

  @Prop({ required: true })
  complain: string;

  @Prop({ required: true })
  prescription: string;

  @Prop({ required: true })
  advice: string;

  @Prop()
  referral: string;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
