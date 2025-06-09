import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';



export class BookSessionDto {
  @ApiPropertyOptional({ type: [String], description: 'List of specialty IDs' })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsString({ each: true })
  specialty?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Languages the user is proficient in' })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsString({ each: true })
  languageProficiency?: string[];

  @ApiPropertyOptional({ description: 'Patient name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Patient gender' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'Patient age' })
  @IsOptional()
  @IsString()
  age?: string;

  @ApiProperty({ description: 'ID of the user booking the session' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'ID of the preferred practitioner (optional)' })
  @IsString()
  @IsOptional()
  practitionerId?: string;
}


export class CreateReviewDto {
  @ApiProperty({ description: 'ID of the session being reviewed' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'ID of the medical practitioner being reviewed' })
  @IsString()
  @IsNotEmpty()
  practitionerId: string;

  @ApiPropertyOptional({ description: 'Rating from 1 to 5' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ description: 'Written review of the session' })
  @IsString()
  @IsNotEmpty()
  review: string;
}



