/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * create-session.dto.ts — PATCHED
 *
 * FIXES vs original:
 * 1. CreatePrescriptionDto fields aligned with frontend writePrescription.tsx:
 *    - `complain` → `complaint` (alias accepted, both optional for compat)
 *    - `advice`   → `prognosis` (alias)
 *    - Added `diagnosis` field (was missing entirely)
 * 2. practitionerId made optional in CreatePrescriptionDto
 *    (controller sets it from JWT, so body doesn't need to send it)
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class BookSessionDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsString({ each: true })
  specialty?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsString({ each: true })
  languageProficiency?: string[];

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  practitionerId?: string;
}

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  practitionerId: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  review: string;
}

export class CreateConsultationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  practitionerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicalIssueId: string;

  @ApiPropertyOptional({ example: 'pending' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  // FIX: controller sets this from JWT token — made optional in body
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  practitionerId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicalIssueId: string;

  // FIX: frontend sends `complaint` — accept both spellings
  @ApiPropertyOptional({
    description: 'Patient complaint (also accepted as complain)',
  })
  @IsString()
  @IsOptional()
  complaint?: string;

  // Keep original field for schema compat
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  complain?: string;

  // FIX: frontend sends `diagnosis` — was missing entirely
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiProperty({ description: 'Prescribed medications' })
  @IsString()
  @IsNotEmpty()
  prescription: string;

  // FIX: frontend sends `prognosis` — accept both
  @ApiPropertyOptional({ description: 'Prognosis / advice' })
  @IsString()
  @IsOptional()
  prognosis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  advice?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referral?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  consultationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  patientId?: string;
}
