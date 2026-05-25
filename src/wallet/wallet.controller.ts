/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/**
 * wallet.controller.ts — PATCHED
 *
 * FIXES vs original:
 * 1. Added POST :userId/deduct — used by frontend for ALL wallet payments
 *    (consultations, pharmacy, lab, emergency, estate, subscription)
 * 2. Added POST :userId/withdraw — providers use "Credit Me" / payout request
 * 3. Hardcoded Paystack secret in verifyPaystackSignature → moved to env var
 * 4. VERIFY_PAYMENT env var hardcoded as paystack URL → fixed
 * 5. Added GET :userId/transactions alias (frontend calls both paths)
 */
import {
  Controller,
  Post,
  Body,
  Param,
  BadRequestException,
  Get,
  NotFoundException,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import axios from 'axios';
import { Wallet } from './schema/wallet.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as dotenv from 'dotenv';
import {
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User, UserDocument } from 'src/user/Schema/user.schema';
import * as crypto from 'crypto';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;
if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY is not set in environment variables');
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

  // ── Balance ───────────────────────────────────────────────────────────────
  @Get(':userId/balance')
  @ApiOperation({ summary: 'Get user wallet balance' })
  @ApiParam({ name: 'userId', required: true })
  async getWalletBalance(
    @Param('userId') userId: string,
  ): Promise<{ balance: number; loanBalance: number }> {
    return this.walletService.getWalletBalance(userId);
  }

  // ── Transactions (two URL patterns — frontend uses both) ──────────────────
  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get transaction history for a user' })
  async getTransactions(@Param('userId') userId: string) {
    if (!userId) throw new NotFoundException('User ID is required');
    return this.walletService.getTransactionHistorys(userId);
  }

  @Get(':userId/transactions')
  async getTransactionsAlt(@Param('userId') userId: string) {
    if (!userId) throw new NotFoundException('User ID is required');
    return this.walletService.getTransactionHistorys(userId);
  }

  // ── Deposit (Paystack reference) ──────────────────────────────────────────
  @Post(':userId/deposit')
  async deposit(
    @Param('userId') userId: string,
    @Body('reference') reference: string,
  ): Promise<{ success: boolean; message: string; deposit: any }> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found.');

    const { isPaymentValid, amount, status } =
      await this.validatePayment(reference);
    if (!isPaymentValid) {
      throw new BadRequestException(
        'Invalid payment. Amount mismatch, invalid reference, or reference already used.',
      );
    }
    this.usedReferences.add(reference);
    if (amount === undefined || status === undefined) {
      throw new BadRequestException('Invalid payment amount or status.');
    }
    return this.walletService.deposit(userId, amount, reference, status);
  }

  // ── NEW: Deduct — used by frontend for every in-app payment ───────────────
  @Post(':userId/deduct')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Deduct amount from user wallet (in-app payment)' })
  @ApiParam({ name: 'userId', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: { type: 'number', example: 1500 },
        description: { type: 'string', example: 'Consultation payment' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Deduction successful' })
  async deductFromWallet(
    @Param('userId') userId: string,
    @Body() body: { amount: number; description?: string },
  ) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }
    const { balance } = await this.walletService.getWalletBalance(userId);
    if (balance < body.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ₦${balance}, Required: ₦${body.amount}`,
      );
    }
    await this.walletService.debit(
      userId,
      body.amount,
      body.description ?? 'Wallet deduction',
    );
    const updated = await this.walletService.getWalletBalance(userId);
    return {
      success: true,
      message: 'Deduction successful',
      newBalance: updated.balance,
    };
  }

  // ── NEW: Withdraw / Credit Me — providers request payout ─────────────────
  @Post(':userId/withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Request a payout (Credit Me) — admin processes' })
  @ApiParam({ name: 'userId', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount'],
      properties: { amount: { type: 'number', example: 5000 } },
    },
  })
  async requestWithdrawal(
    @Param('userId') userId: string,
    @Body() body: { amount: number },
  ) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found.');

    // Record as a pending withdrawal transaction so admin can see it
    await this.walletService.addTransaction(userId, {
      amount: body.amount,
      type: 'withdrawal',
      description: `Payout request ₦${body.amount} — pending admin approval`,
      timestamp: new Date(),
      status: 'pending',
    });

    return {
      success: true,
      message: 'Payout request submitted. Admin will process within 24 hours.',
      amount: body.amount,
      bankDetails: user.bankDetails ?? null,
    };
  }

  // ── VIP / App-data subscription ──────────────────────────────────────────
  // Called by vipSubscription.tsx and appDataSubscription.tsx
  // tier: 'basic' | 'vip' | 'app_data'
  // Costs: basic = 2000, vip = 5000, app_data = 500 (PioCoins)
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Subscribe to a VIP or App Data plan' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'tier'],
      properties: {
        userId: { type: 'string' },
        tier: { type: 'string', enum: ['basic', 'vip', 'app_data'] },
      },
    },
  })
  async subscribe(@Body() body: { userId: string; tier: string }) {
    const TIER_COSTS: Record<string, number> = {
      basic: 2000,
      vip: 5000,
      app_data: 500,
    };
    const cost = TIER_COSTS[body.tier];
    if (!cost) {
      throw new BadRequestException(`Invalid subscription tier: ${body.tier}`);
    }
    const wallet = await this.walletService.getWalletByUserId(body.userId);
    if (!wallet || wallet.balance < cost) {
      throw new BadRequestException(
        `Insufficient balance. Required: ₦${cost}, Available: ₦${wallet?.balance ?? 0}`,
      );
    }
    wallet.balance -= cost;
    wallet.transactions.push({
      amount: cost,
      type: 'WITHDRAWAL' as any,
      description: `${body.tier.toUpperCase()} subscription`,
      timestamp: new Date(),
    } as any);
    await wallet.save();
    return {
      success: true,
      message: `${body.tier} subscription activated successfully.`,
      newBalance: wallet.balance,
    };
  }

  // ── Paystack webhook ──────────────────────────────────────────────────────
  @Post('verify-deposit')
  @HttpCode(HttpStatus.OK)
  async paystackWebhook(
    @Req() request: Request,
    @Headers('x-paystack-signature') signature: string,
  ): Promise<void> {
    const webhookEvent =
      typeof request.body === 'string'
        ? JSON.parse(request.body)
        : request.body;

    if (!this.verifyPaystackSignature(webhookEvent, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { event, data } = webhookEvent;
    const reference = data.reference;
    const status = data.status;
    const amount = data.amount / 100;
    const userId = data.metadata?.cart_id ?? data.metadata?.userId;

    if (event === 'charge.success' && userId) {
      await this.walletService.deposit(userId, amount, reference, status);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private async validatePayment(
    reference: string,
  ): Promise<{ isPaymentValid: boolean; amount?: number; status?: string }> {
    try {
      if (this.usedReferences.has(reference)) return { isPaymentValid: false };

      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
      );

      const { status, amount } = response.data.data;
      return status === 'success'
        ? { isPaymentValid: true, amount: amount / 100, status }
        : { isPaymentValid: false };
    } catch {
      return { isPaymentValid: false };
    }
  }

  // FIX: was using hardcoded key — now uses env var
  private verifyPaystackSignature(body: any, signature: string): boolean {
    const computed = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(body))
      .digest('hex');
    return computed === signature;
  }
}
