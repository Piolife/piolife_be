import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseItemDto {
  @ApiProperty({
    description: 'ID of the drug / stock item to purchase',
    example: '7314671080105312256',
  })
  @IsString()
  @IsNotEmpty()
  stockId: string;

  @ApiProperty({ description: 'Quantity to buy', example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class BuyItemDto {
  @ApiProperty({
    description: 'List of items to purchase',
    type: [PurchaseItemDto],
  })
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  @ArrayMinSize(1)
  items: PurchaseItemDto[];

  @ApiProperty({
    description: 'Buyer user ID',
    example: '7314671080105312256',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Practitioner (seller) ID',
    example: '7314671080105312256',
  })
  @IsString()
  @IsNotEmpty()
  practitionerId: string;
}
