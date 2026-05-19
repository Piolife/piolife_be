/**
 * laborder.dto.ts — PATCHED
 *
 * FIX: Added `diagnosisNote` field — frontend sends it so the lab scientist
 * can see the doctor's diagnostic instructions. Original DTO silently dropped it.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLabOrderDto {
  @ApiProperty({ description: 'IDs of the tests being ordered' })
  @IsArray()
  @IsNotEmpty()
  testIds: string[];

  @ApiProperty({ description: 'ID of the patient placing the order' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'ID of the lab (userId of the lab provider)' })
  @IsString()
  @IsNotEmpty()
  labId: string;

  // FIX: was missing — frontend sends the doctor's diagnostic note
  @ApiPropertyOptional({
    description: "Doctor's diagnostic note shown to lab scientist",
  })
  @IsString()
  @IsOptional()
  diagnosisNote?: string;
}
