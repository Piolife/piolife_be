import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalIssueDto {
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
}
