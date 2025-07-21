import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePharmacyStockDto {
  @ApiProperty({ description: 'Name of the medical issue' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Image representation of the issue' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Description of the issue' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of consultation for this issue', example: 5000 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Quantity of consultation for this issue', example: 5 })
  @IsNumber()
  quantity: number;
}


// dto/buy-stock.dto.ts
export class BuyStockDto {
  stockId: string;
  quantity: number;
  userId: string; 
}
