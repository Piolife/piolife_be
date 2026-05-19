/**
 * prescription.schema.ts — PATCHED
 *
 * FIXES vs original:
 * 1. Added `diagnosis` field (was missing — frontend sends it, backend ignored it)
 * 2. Added `complaint` alias alongside `complain` so both work
 * 3. Added `prognosis` alias alongside `advice`
 * 4. Made `complain`, `prescription`, `advice` not strictly required
 *    so partial prescriptions can be saved (doctor may submit incrementally)
 * 5. Added `consultationId` so prescriptions link to a specific consultation
 */
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

  @Prop({ type: String, ref: 'MedicalIssue' })
  medicalIssueId: string;

  // FIX: added consultationId so prescription links to the call
  @Prop({ type: String, ref: 'Consultations' })
  consultationId?: string;

  // Original field name kept for DB compat
  @Prop()
  complain?: string;

  // FIX: alias — frontend sends `complaint`
  @Prop()
  complaint?: string;

  // FIX: `diagnosis` was completely missing from schema
  @Prop()
  diagnosis?: string;

  @Prop()
  prescription?: string;

  // Original field name kept for DB compat
  @Prop()
  advice?: string;

  // FIX: alias — frontend sends `prognosis`
  @Prop()
  prognosis?: string;

  @Prop()
  referral?: string;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
