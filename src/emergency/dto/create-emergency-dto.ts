import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
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
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'State of caller' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'lga of caller' })
  @IsString()
  @IsNotEmpty()
  lga: string;

  @ApiProperty({ description: 'ward of caller' })
  @IsString()
  @IsNotEmpty()
  ward: string;
}
export class CallEmergencyFormData {
  @ApiProperty({ description: 'Nature Of Incident' })
  @IsString()
  @IsNotEmpty()
  natureOfIncident: string;

  @ApiProperty({ description: 'Address of caller' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'State of caller' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'lga of caller' })
  @IsString()
  @IsNotEmpty()
  lga: string;

  @ApiProperty({ description: 'ward of caller' })
  @IsString()
  @IsNotEmpty()
  ward: string;
}
