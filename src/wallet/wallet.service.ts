/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  NotFoundException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TransactionType,
  Wallet,
  WalletDocument,
} from './schema/wallet.schema';
import { User, UserDocument } from 'src/user/Schema/user.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createWallet(userId: string): Promise<WalletDocument> {
    const existingWallet = await this.walletModel.findOne({ userId });
    if (existingWallet) {
      throw new BadRequestException('User already has a wallet.');
    }

    const wallet = new this.walletModel({
      userId,
      balance: 0,
      transactions: [],
    });
    return await wallet.save();
  }

  async deposit(
    userId: string,
    amount: number,
    reference: string,
    status: string,
  ) {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException('Wallet not found for user.');
    }

    const depositTransaction = {
      amount,
      timestamp: new Date(),
      type: 'deposit',
      transactionRef: reference,
      status: status,
      description: `Deposit of ₦${amount} with reference ${reference}`,
    };

    // PRD: 30% of every deposit auto-repays outstanding loan balance
    let creditAmount = amount;
    let loanRepaid = 0;
    if ((wallet.loanBalance ?? 0) > 0) {
      loanRepaid = Math.min(amount * 0.3, wallet.loanBalance);
      creditAmount = amount - loanRepaid;
    }

    const updatedWallet = await this.walletModel.findOneAndUpdate(
      { userId },
      {
        $push: { transactions: depositTransaction },
        $inc: { balance: creditAmount, loanBalance: -loanRepaid },
      },
      { new: true, useFindAndModify: false },
    );

    if (!updatedWallet) {
      throw new NotFoundException('Failed to update wallet.');
    }

    return {
      success: true,
      message: loanRepaid > 0
        ? `Deposit successful. ₦${loanRepaid} applied to your loan balance.`
        : 'Deposit successful',
      deposit: depositTransaction,
    };
  }

  async getWalletByUserId(userId: string): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOne({ userId }).exec();
    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }
    return wallet;
  }

  async getWalletBalance(
    userId: string,
  ): Promise<{ balance: number; loanBalance: number; reserved: number }> {
    const wallet = await this.walletModel.findOne({ userId });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const reserved = wallet.reserved ?? 0;
    return {
      // balance is the spendable amount — gross balance minus any active holds
      balance: wallet.balance - reserved,
      loanBalance: wallet.loanBalance || 0,
      reserved,
    };
  }

  // Lock funds for a pending consultation. Idempotent: safe to call twice for the same consultationId.
  async reserve(userId: string, amount: number, consultationId: string): Promise<void> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const alreadyReserved = (wallet.reservations ?? []).some(
      (r) => r.consultationId === consultationId,
    );
    if (alreadyReserved) return;

    const available = wallet.balance - (wallet.reserved ?? 0);
    if (available < amount) {
      throw new ForbiddenException(
        `Insufficient balance. Available: ${available}, Required: ${amount}`,
      );
    }

    wallet.reserved = (wallet.reserved ?? 0) + amount;
    wallet.reservations = wallet.reservations ?? [];
    (wallet.reservations as any[]).push({ consultationId, amount, createdAt: new Date() });
    wallet.transactions.push({
      amount,
      type: TransactionType.CONSULTATION_RESERVE,
      description: 'Consultation fee held (pending call)',
      timestamp: new Date(),
    });
    await wallet.save();
  }

  // Release a hold — called when the doctor declines or the call is cancelled.
  async release(userId: string, consultationId: string): Promise<void> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const reservations = (wallet.reservations ?? []) as any[];
    const idx = reservations.findIndex((r) => r.consultationId === consultationId);
    if (idx === -1) return; // already released or never reserved

    const { amount } = reservations[idx];
    reservations.splice(idx, 1);
    wallet.reservations = reservations;
    wallet.reserved = Math.max((wallet.reserved ?? 0) - amount, 0);
    wallet.transactions.push({
      amount,
      type: TransactionType.CONSULTATION_RELEASE,
      description: 'Consultation fee released (cancelled)',
      timestamp: new Date(),
    });
    await wallet.save();
  }

  // Finalise a hold — called inside createPrescription when service is delivered.
  // Moves the reserved amount out of balance (patient pays) and returns the amount
  // so the caller can credit the doctor.
  async capture(userId: string, consultationId: string): Promise<number> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const reservations = (wallet.reservations ?? []) as any[];
    const idx = reservations.findIndex((r) => r.consultationId === consultationId);
    if (idx === -1) return 0; // no active hold — caller falls back to medicalIssueId price

    const { amount } = reservations[idx];
    reservations.splice(idx, 1);
    wallet.reservations = reservations;
    wallet.reserved = Math.max((wallet.reserved ?? 0) - amount, 0);
    wallet.balance -= amount; // gross balance now reduced — spendable balance unchanged
    wallet.transactions.push({
      amount,
      type: TransactionType.CONSULTATION_PAYMENT,
      description: 'Consultation fee paid',
      timestamp: new Date(),
    });
    await wallet.save();
    return amount;
  }

  async getWallet(userId: string): Promise<WalletDocument> {
    let wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      wallet = new this.walletModel({
        userId,
        balance: 0,
        loanEligibility: 20000,
      });
      await wallet.save();
    }
    return wallet;
  }

  async reduceLoanEligibility(userId: string, amount: number): Promise<Wallet> {
    const wallet = await this.getWallet(userId);

    if (wallet.loanEligibility < amount) {
      throw new Error('You are not eligible for loan at this time');
    }
    wallet.loanEligibility -= amount;
    await wallet.save();
    return wallet;
  }

  async addFunds(userId: string, amount: number): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    wallet.balance += amount;
    await wallet.save();
    return wallet;
  }

  async deductFunds(userId: string, amount: number): Promise<void> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found.');
    wallet.balance -= amount;
    await wallet.save();
  }

  async updateLoanBalance(userId: string, amount: number): Promise<void> {
    const wallet = await this.getWallet(userId);
    wallet.loanBalance += amount;
    await wallet.save();
  }

  async reduceLoanBalance(userId: string, amount: number): Promise<void> {
    const wallet = await this.getWallet(userId);
    wallet.loanBalance = Math.max(wallet.loanBalance - amount, 0);
    await wallet.save();
  }

  async addTransaction(
    userId: string,
    transaction: any,
  ): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }
    wallet.transactions.push(transaction);
    await wallet.save();

    return wallet;
  }

  async updateLoanEligibility(
    userId: string,
    newEligibility: number,
  ): Promise<void> {
    await this.walletModel.updateOne(
      { userId },
      { $set: { loanEligibility: newEligibility } },
    );
  }

  async credit(userId: string, amount: number, description: string) {
    const wallet = await this.walletModel.findOne({ userId });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    wallet.balance += amount;
    wallet.transactions.push({
      amount,
      type: TransactionType.REFERRAL_BONUS,
      description: description,
      timestamp: new Date(),
    });
    await wallet.save();
  }
  async debit(userId: string, amount: number, description: string) {
    const wallet = await this.walletModel.findOne({ userId });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    let remainingAmount = amount;

    // Deduct from balance first
    if (wallet.balance >= remainingAmount) {
      wallet.balance -= remainingAmount;
      remainingAmount = 0;
    } else {
      remainingAmount -= wallet.balance;
      wallet.balance = 0;

      // Deduct remaining from loan if available
      if ((wallet.loanBalance || 0) >= remainingAmount) {
        wallet.loanBalance -= remainingAmount;
        remainingAmount = 0;
      }
    }

    if (remainingAmount > 0) {
      throw new ForbiddenException('Insufficient balance and loan limit.');
    }

    wallet.transactions.push({
      amount,
      type: TransactionType.EMERGENCY_PAYMENT, // you may want a proper enum type for emergency debit
      description,
      timestamp: new Date(),
    });

    await wallet.save();
  }

  async transferFunds(userId: string, practitionerId: string, amount: number) {
    const userWallet = await this.walletModel.findOne({ userId });
    const practitionerWallet = await this.walletModel.findOne({
      userId: practitionerId,
    });

    if (!userWallet || userWallet.balance < amount) {
      throw new ForbiddenException("Insufficient balance in user's wallet");
    }

    if (!practitionerWallet) {
      throw new NotFoundException("Practitioner's wallet not found");
    }

    userWallet.balance -= amount;
    practitionerWallet.balance += amount;

    userWallet.transactions.push({
      amount,
      type: TransactionType.CONSULTATION_PAYMENT,
      description: `Paid ₦${amount} for medical consultation`,
      timestamp: new Date(),
    });
    practitionerWallet.transactions.push({
      amount,
      type: TransactionType.CONSULTATION_FEE,
      description: `Received ₦${amount} for consultation}`,
      timestamp: new Date(),
    });
    await userWallet.save();
    await practitionerWallet.save();
  }

  async getTransactionHistorys(userId: string): Promise<{
    userId: string;
    balance: number;
    transactions: Array<{ amount: number; type: string; timestamp: Date }>;
  }> {
    const wallet = await this.walletModel.findOne({ userId }).lean();

    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }

    return {
      userId: wallet.userId,
      balance: wallet.balance,
      transactions: (wallet.transactions || []).map((transaction) => ({
        ...transaction,
        timestamp: transaction.timestamp || new Date(),
      })),
    };
  }
}
