// src/medical-issues/dto/create-medical-issue.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateMedicalIssueDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;
}
