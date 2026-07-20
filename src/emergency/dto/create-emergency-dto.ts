import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmergencyStockDto {
  @ApiProperty({ description: 'cost of service' })
  @IsNumber()
  services_amount: number;

  @ApiProperty({ description: 'Percentage of the facility', example: 5000 })
  @IsNumber()
  percentage_amount: number;
}

export class geoLocationDto {
  @ApiProperty({ description: 'Address of caller' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'State of caller' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'lga of caller' })
  @IsString()
  lga: string;

  @ApiProperty({ description: 'ward of caller' })
  @IsString()
  ward: string;
}

export class CallEmergencyFormData {
  // Direct GPS coords (new frontend flow)
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  // Accepts both field names from old and new frontend
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  incidentType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  natureOfIncident?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  locationDescription?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  landmark?: string;

  // Legacy address-based fields
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lga?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ward?: string;
}
