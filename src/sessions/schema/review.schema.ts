// @Schema({ timestamps: true })
// export class Review {
//   @Prop({ required: true }) sessionId: string;
//   @Prop({ required: true }) userId: string;
//   @Prop({ required: true }) practitionerId: string;
//   @Prop({ required: true }) rating: number;
//   @Prop({ required: true }) review: string;
// }

// export const ReviewSchema = SchemaFactory.createForClass(Review);
// export type ReviewDocument = Review & Document;
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
// export class Session {
//   @Prop({
//     type: String,
//     default: () => snowflakeIdGenerator.generate(),
//     required: true,
//   })
//   _id: string;

//   @Prop({ required: true })
//   userId: string;

//   @Prop({ required: true })
//   practitionerId: string;

//   @Prop({ type: [String], default: [] })
//   languageProficiency: string[];

//   @Prop({ type: [String], default: [] })
//   specialty: string[];

//   @Prop()
//   name: string;

//   @Prop()
//   age: string;

//   @Prop()
//   gender: string;

//   @Prop({ default: 'pending', enum: ['pending', 'in-progress', 'completed', 'cancelled'] })
//   status: string;

//   @Prop()
// review?: string;

// @Prop()
// rating?: number;

// @Prop({ default: false })
// reviewSubmitted: boolean;

// }

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
  }

export const ReviewSchema = SchemaFactory.createForClass(Review);
