import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class CreateLabOrderDto {
  @ApiProperty({
    description: 'Array of selected lab test IDs',
    type: [String],
    example: ['64fa21c3d4e8a2f9d23b4567', '64fa21c3d4e8a2f9d23b4568'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  testIds: string[];

  @ApiProperty({
    description: 'User ID who is booking the tests',
    example: '64fa21c3d4e8a2f9d23b1234',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'MedLab ID providing the tests',
    example: '64fa21c3d4e8a2f9d23b5678',
  })
  @IsString()
  medLabId: string;
}
