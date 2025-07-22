import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePharmacyStockDto {
  @ApiPropertyOptional({ description: 'Updated name of the drug' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated image of the drug' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Updated description of the drug' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated price of the drug',
    example: 6000,
  })
  @IsOptional()
  @IsNumber()
  price?: number;
}
