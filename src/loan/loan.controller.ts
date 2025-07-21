import { Controller, Post, Get, Param, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoanService } from './loan.service';
import { WalletService } from '../wallet/wallet.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/Schema/user.schema';
import { RepayLoanDto, RequestLoanDto } from './dto/loan.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Loans') 
@Controller('loans')
export class LoanController {
  constructor(
    private readonly loanService: LoanService,
    private readonly walletService: WalletService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  // Request a loan (auto-approve if eligible)
  @Post(':userId/request')
  @ApiOperation({ summary: 'Request a loan (auto-approved if eligible)' })
  @ApiParam({ name: 'userId', required: true, description: 'User ID' })
  @ApiBody({ type: RequestLoanDto })
  @ApiResponse({ status: 201, description: 'Loan requested successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid loan request.' })
  async requestLoan(@Param('userId') userId: string, @Body() requestLoanDto: RequestLoanDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (requestLoanDto.amount <= 0) {
      throw new BadRequestException('Loan amount must be greater than zero.');
    }

    return this.loanService.requestLoan(userId, requestLoanDto.amount);
  }

  @Get(':userId/eligibility')
  @ApiOperation({ summary: 'Check loan eligibility' })
  @ApiParam({ name: 'userId', required: true, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns loan eligibility and balance.' })
  @ApiResponse({ status: 404, description: 'User or wallet not found.' })
  async getLoanEligibility(@Param('userId') userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) {
      throw new NotFoundException('User wallet not found.');
    }
    return {
      userId,
      loanEligibility: wallet.loanEligibility,
      walletBalance: wallet.balance,
    };
  }
  @Get('user/:userId')
  async getUserLoansWithBalance(@Param('userId') userId: string) {
    const loans = await this.loanService.getUserLoansWithBalance(userId);

    if (!loans.length) {
      throw new NotFoundException('No loans found for this user.');
    }

    return {
      message: 'User loans retrieved successfully.',
      data: loans,
    };
  }

  @Post(':userId/repay/:loanId')
  @ApiOperation({ summary: 'Repay a loan' })
  @ApiParam({ name: 'userId', required: true, description: 'User ID' })
  @ApiParam({ name: 'loanId', required: true, description: 'Loan ID' })
  @ApiBody({ type: RepayLoanDto })
  @ApiResponse({ status: 200, description: 'Loan repayment successful.' })
  @ApiResponse({ status: 400, description: 'Invalid repayment amount.' })
  async repayLoan(@Param('userId') userId: string, @Param('loanId') loanId: string, @Body() body: { amount: number }) {
    if (body.amount <= 0) {
      throw new BadRequestException('Repayment amount must be greater than zero.');
    }
    return this.loanService.repayLoan(userId, loanId, body.amount);
  }

  @Get(':userId/history')
  @ApiOperation({ summary: 'Get loan history (includes loans and repayments)' })
  @ApiParam({ name: 'userId', required: true, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns loan and repayment history.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getLoanHistory(@Param('userId') userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const history = await this.loanService.getLoanHistory(userId);
    return history;
  }
}
