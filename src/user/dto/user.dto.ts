import { IsEnum, IsOptional, IsString, IsNotEmpty, IsEmail, ValidateIf, IsNumber, } from 'class-validator';
import { UserRole, UserStatus } from '../enum/user.enum';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

// export class CreateUserDto {
//   @IsString()
//   @IsNotEmpty()
//   firstName: string;

//   @IsString()
//   @IsNotEmpty()
//   lastName: string;

//   @IsString()
//   @IsOptional()
//   otherName?: string;

//   @IsOptional()
//   username?: string;

//   @IsString()
//   @IsEmail({}, { message: 'Invalid email format' })
//   @IsNotEmpty()
//   email: string;

//   @IsString()
//   @IsNotEmpty()
//   password: string;

//   @IsEnum(UserRole)
//   @IsNotEmpty()
//   role: UserRole;

//   @IsEnum(UserStatus)
//   @IsOptional()
//   status?: UserStatus;

//   @IsString()
//   @IsOptional()
//   gender?: string;

//   @IsString()
//   @IsOptional()
//   dateOfBirth?: string;

//   @IsString()
//   @IsOptional()
//   profilePicture: string;

//   @IsString()
//   @IsOptional()
//   maritalStatus?: string;

//   @IsString()
//   @IsOptional()
//   countryOrigin?: string;

//   @IsString()
//   @IsNotEmpty()
//   phoneNumber: string;

  
//   @IsString()
//   @IsOptional()
//   stateOfOrigin: string;


//   @IsString()
//   @IsOptional()
//   countryOfResidence: string;

//   @IsString()
//   @IsOptional()
//   stateOfResidence: string;

//   @IsString()
//   @IsOptional()
//   profileImage: string;

//   @IsString()
//   @IsOptional()
//   degreeCertificate?: string;

//   @IsString()
//   @IsOptional()
//   currentPracticeLicense?: string;

//   @IsString()
//   @IsOptional()
//   specialty?: Array<string>;

//   @IsString()
//   @IsOptional()
//   ward?:string

//   @IsString()
//   @IsOptional()
//   localGovernmentArea:string
//   @IsString()
//   @IsOptional()
//   pharmacyName?:string

//   @IsString()
//   @IsOptional()
//   medicalLabName?:string

//   @IsString()
//   @IsOptional()
//   alternativePhoneNumber?: string;


//   @IsOptional()
//   languageProficiency?: Array<string>;

//   @IsString()
//   @IsOptional()
//   policyAgreement?: string;

//   @ValidateIf((dto) => dto.role !== UserRole.CLIENT)
//   @IsNotEmpty({ message: 'At least one bank detail is required for this role.' })
//   @IsOptional()
//   @Type(() => BankDetailsDto)
//   bankDetails?: BankDetailsDto[];


//   @IsString()
//   @IsOptional()
//   hospitalName: string;

//   @IsString()
//   @IsOptional()
//   countryOfOrigin: string;

//   @IsString()
//   @IsOptional()
//   officerInCharge: string;
//   @IsString()
// @IsOptional()
// referralCode?: string;

// @IsString()
// @IsOptional()
// myReferralCode?: string;

// }

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  otherName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  profilePicture: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryOrigin?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stateOfOrigin: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryOfResidence: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stateOfResidence: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profileImage: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  degreeCertificate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currentPracticeLicense?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  specialty?: Array<string>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  localGovernmentArea: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pharmacyName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  medicalLabName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alternativePhoneNumber?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  languageProficiency?: Array<string>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  policyAgreement?: string;

  @ApiPropertyOptional({ type: [BankDetailsDto] })
  @ValidateIf((dto) => dto.role !== UserRole.CLIENT)
  @IsNotEmpty({ message: 'At least one bank detail is required for this role.' })
  @IsOptional()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hospitalName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryOfOrigin: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  officerInCharge: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  myReferralCode?: string;


  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude: number;
}


export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  readonly email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  readonly password: string;
}

export  class LogoutDto {
    @ApiProperty({ example: 'user_1234567890' })
    @IsString()
    userId: string;
  }