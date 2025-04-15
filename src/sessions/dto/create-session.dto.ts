import { IsDateString, IsIn, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  user: string;

  @IsString()
  medicalPractitioner: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  medicalIssue: string | string[];
  
  @IsOptional() 
    @IsNumber()
    price: number;
}

export class UpdateSessionStatusDto {
    @IsString()
    @IsIn(['pending', 'in-progress', 'completed', 'cancelled']) 
    status: string;
  }
  