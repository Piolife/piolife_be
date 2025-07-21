import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestLoanDto {
  @ApiProperty({
    description: 'The amount of loan requested',
    example: 500,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  amount: number;
}

export class RepayLoanDto {
  @ApiProperty({
    description: 'The amount being repaid for the loan',
    example: 200,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  amount: number;
}
