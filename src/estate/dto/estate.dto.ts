/**
 * estate.dto.ts — NEW
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString,
} from 'class-validator';

export class CreateEstateOrderDto {
  @ApiProperty() @IsString() @IsNotEmpty() userId: string;
  @ApiProperty() @IsString() @IsNotEmpty() plotNumber: string;
  @ApiProperty() @IsString() @IsNotEmpty() estateName: string;
  @ApiProperty() @IsString() @IsNotEmpty() state: string;
  @ApiPropertyOptional() @IsString() @IsOptional() lga?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() ward?: string;
  @ApiProperty() @IsNumber() propertyValue: number;
  @ApiProperty({ enum: ['instalment', 'outright'] })
  @IsEnum(['instalment', 'outright']) paymentType: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() instalmentAmount?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() officialName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() matricNumber?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() institution?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() agreementDate?: string;
  @ApiPropertyOptional({ enum: ['student', 'pioland', 'luxury'] })
  @IsOptional() category?: string;
}

export class MakeInstalmentDto {
  @ApiProperty() @IsNumber() amount: number;
}
