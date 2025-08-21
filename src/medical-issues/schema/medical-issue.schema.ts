import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';
const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type MedicalIssueDocument = MedicalIssue & Document;

@Schema()
export class MedicalIssue {
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
}

export const MedicalIssueSchema = SchemaFactory.createForClass(MedicalIssue);
