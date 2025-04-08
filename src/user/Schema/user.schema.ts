import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnowflakeIdGenerator } from 'utils/idGenerator';
import { UserRole, UserStatus } from '../enum/user.enum';
const snowflakeIdGenerator = new SnowflakeIdGenerator();

export type UserDocument = User & Document;


class BankDetails {
    @Prop({ required: true })
    bankName: string;
  
    @Prop({ required: true })
    accountName: string;
  
    @Prop({ required: true })
    accountNumber: string;
  }
  

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    default: () => snowflakeIdGenerator.generate(),
    required: true,
  })
  _id: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true, unique: false })
  email: string;

  @Prop()
  otherName: string;

  @Prop()
  password: string;

  @Prop()
  gender: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  profileImage: string;


  @Prop()
  profilePicture: string;

@Prop()
maritalStatus: string;

@Prop()
dateOfBirth: string;

@Prop()
phoneNumber: string;

@Prop()
countryOfOrigin: string;

@Prop()
stateOfOrigin: string;

@Prop()
countryOfResidence: string;
@Prop()
username : string;

@Prop()
stateOfResidence: string;

@Prop({ type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE })
status: UserStatus;

@Prop({ type: String, enum: Object.values(UserRole), default: UserRole.CLIENT })
role: UserRole;


@Prop({ type: Boolean, default: false })
twoFactorEnabled: boolean;


@Prop()
degreeCertificate?: string;

@Prop()
currentPracticeLicense?: string;


@Prop({ type: [BankDetails], default: [] }) 
bankDetails?: BankDetails[];

@Prop()
languageProficiency?: Array<string>;
@Prop()
specialty: string;

@Prop()
hospitalName: string;
@Prop()
officerInCharge: string;
@Prop()
alternatePhoneNumber: string;

@Prop()
localGovernmentArea: string;

@Prop({ type: Boolean, default: false })
policyAgreement: boolean;

@Prop()
ward: string;


}
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1, role: 1 }, { unique: true });

