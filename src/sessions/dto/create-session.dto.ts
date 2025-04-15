import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'ID of the user booking the session' })
  @IsString()
  user: string;

  @ApiProperty({ description: 'ID of the medical practitioner' })
  @IsString()
  medicalPractitioner: string;

  @ApiProperty({ description: 'Date of the session', example: '2025-04-15T10:00:00Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Reason for booking the session' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Medical issue(s)', type: [String] })
  @IsOptional()
  medicalIssue: string | string[];

  @ApiPropertyOptional({ description: 'Session price', example: 5000 })
  @IsOptional()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Patient name' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Patient age' })
  @IsOptional()
  @IsString()
  age: string;

  @ApiPropertyOptional({ description: 'Patient gender', example: 'male' })
  @IsOptional()
  @IsString()
  gender: string;
}


export class UpdateSessionStatusDto {
  @ApiProperty({
    description: 'Status of the session',
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
  })
  @IsString()
  @IsIn(['pending', 'in-progress', 'completed', 'cancelled'])
  status: string;
}

  