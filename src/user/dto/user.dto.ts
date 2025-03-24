import { IsEnum, IsOptional, IsString, IsNotEmpty, IsEmail, ValidateIf, } from 'class-validator';
import { UserRole, UserStatus } from '../enum/user.enum';
import { Type } from 'class-transformer';

class BankDetailsDto {
  @IsString()
  @IsOptional()
  bankName: string;

  @IsString()
  @IsOptional()
  accountName: string;

  @IsString()
  @IsOptional()
  accountNumber: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  otherName?: string;

  @IsString()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  profilePicture: string;

  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @IsString()
  @IsOptional()
  countryOrigin?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;


  @IsString()
  @IsOptional()
  stateOfOrigin: string;


  @IsString()
  @IsOptional()
  countryOfResidence: string;

  @IsString()
  @IsOptional()
  stateOfResidence: string;

  @IsString()
  @IsOptional()
  profileImage: string;

  /** 🔥 Admin-only fields */
  @IsString()
  @IsOptional()
  degreeCertificate?: string;

  @IsString()
  @IsOptional()
  currentPracticeLicense?: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  ward?:string

  @IsString()
  @IsOptional()
  localGovernmentArea:string


  @IsOptional()
  languageProficiency?: Array<string>;

  @IsString()
  @IsOptional()
  policyAgreement?: string;

  @ValidateIf((dto) => dto.role !== UserRole.CLIENT)
  @IsNotEmpty({ message: 'At least one bank detail is required for this role.' })
  @IsOptional()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto[];


  @IsString()
  @IsOptional()
  hospitalName: string;

  @IsString()
  @IsOptional()
  countryOfOrigin: string;

  @IsString()
  @IsOptional()
  officerInCharge: string;
}


export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  readonly email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  readonly password: string;
}
