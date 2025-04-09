import { Controller, Post, Body, Param, BadRequestException, Get, NotFoundException, UseGuards, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { WalletService } from './wallet.service';
import axios from 'axios';
import { Wallet } from './schema/wallet.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as dotenv from 'dotenv';
import { ApiBody, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User, UserDocument } from 'src/user/Schema/user.schema';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  throw new Error('Paystack secret key is missing');
}

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  private usedReferences: Set<string> = new Set();

  constructor(
    private readonly walletService: WalletService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  @ApiExcludeEndpoint()
  @Post(':userId/create')
  async createWallet(@Param('userId') userId: string): Promise<Wallet> {
    return this.walletService.createWallet(userId);
  }

  @Post(':userId/deposit')
  async deposit(
    @Param('userId') userId: string,
    @Body('reference') reference: string,
  ): Promise<{ success: boolean; message: string; deposit: any }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const { isPaymentValid, amount, status } = await this.validatePayment(reference);
    if (!isPaymentValid) {
      throw new BadRequestException('Invalid payment. Amount mismatch, invalid reference number, or reference already used.');
    }

    this.usedReferences.add(reference);

    if (amount === undefined || status === undefined) {
      throw new BadRequestException('Invalid payment amount or status.');
    }

    return this.walletService.deposit(userId, amount, reference, status);
  }

  private async validatePayment(reference: string): Promise<{ isPaymentValid: boolean; amount?: number; status?: string }> {
    try {
      // Check if the reference has been used before
      if (this.usedReferences.has(reference)) {
        console.error('Reference has already been used:', reference);
        return { isPaymentValid: false };
      }

      const response = await axios.get(
        `${process.env.VERIFY_PAYMENT}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      // Extract payment status and amount
      const isPaymentSuccessful = response.data.data.status === 'success';
      const status = response.data.data.status;
      const amount = response.data.data.amount / 100;

      if (isPaymentSuccessful) {
        return { isPaymentValid: true, amount, status };
      } else {
        console.error('Payment verification failed:', response.data);
        return { isPaymentValid: false };
      }
    } catch (error) {
      console.error('Error validating payment with Paystack:', error);
      return { isPaymentValid: false };
    }
  }

  @Post('verify-deposit')
  @HttpCode(HttpStatus.OK)
  async paystackWebhook(@Body() webhookEvent: any, @Headers('x-paystack-signature') signature: string): Promise<void> {
    // Step 1: Verify webhook signature
    const isValidSignature = this.verifyPaystackSignature(webhookEvent, signature);
    if (!isValidSignature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Step 2: Extract event details
    const { event, data } = webhookEvent;
    const reference = data.reference;
    const status = data.status;
    const amount = data.amount / 100; 
    const userId = data.metadata.userId;

    if (event === 'charge.success') {
      // Handle successful payment
      console.log('Payment was successful');
      await this.walletService.deposit(userId, amount, reference, status);
    } else if (event === 'charge.failed') {
      // Handle failed payment
      console.log('Payment failed');
      // Add custom logic to handle failed payments if necessary
    }
  }

  private verifyPaystackSignature(body: any, signature: string): boolean {
    const crypto = require('crypto');
    const computedSignature = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(body))
      .digest('hex');

    return computedSignature === signature;
  }


  @ApiOperation({ summary: 'Get user wallet balance' })
  @ApiParam({ name: 'userId', required: true, description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user’s wallet balance',
    schema: {
      type: 'object',
      properties: {
        balance: { type: 'number', example: 5000 },
      },
    },
  })
  @Get(':userId/balance')
  async getWalletBalance(@Param('userId') userId: string): Promise<{ balance: number, loanBalance: number }> {
    const { balance, loanBalance } = await this.walletService.getWalletBalance(userId);
    return { balance, loanBalance };
  }
}
