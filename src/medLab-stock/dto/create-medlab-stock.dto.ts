import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedLabStockDto {
  @ApiProperty({ description: 'Name of the test' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Price of the test', example: 5000 })
  @IsNumber()
  price: number;
}

// dto/buy-stock.dto.ts
export class BuyStockDto {
  stockId: string;
  quantity: number;
  userId: string;
}
