import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePharmacyStockDto {
  @ApiProperty({ description: 'Name of the drug' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Image representation of the drug' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Description of the drug' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the drug', example: 5000 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Quantity of the drug', example: 5 })
  @IsNumber()
  quantity: number;
}

// dto/buy-stock.dto.ts
export class BuyStockDto {
  stockId: string;
  quantity: number;
  userId: string;
}
