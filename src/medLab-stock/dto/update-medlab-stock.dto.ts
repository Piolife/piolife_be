import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMedLabStockDto {
  @ApiPropertyOptional({ description: 'Updated name of the test' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated price of the test',
    example: 6000,
  })
  @IsOptional()
  @IsNumber()
  price?: number;
}
