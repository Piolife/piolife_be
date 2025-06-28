import { BadRequestException, NotFoundException, Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionType, Wallet, WalletDocument } from './schema/wallet.schema';
import { User, UserDocument } from 'src/user/Schema/user.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  async createWallet(userId: string): Promise<WalletDocument> {
    const existingWallet = await this.walletModel.findOne({ userId });
    if (existingWallet) {
      throw new BadRequestException('User already has a wallet.');
    }

    const wallet = new this.walletModel({ userId, balance: 0, transactions: [] });
    return await wallet.save();
  }

  async deposit(userId: string, amount: number, reference: string, status: string) {
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
    };

    const updatedWallet = await this.walletModel.findOneAndUpdate(
      { userId },
      {
        $push: { transactions: depositTransaction },
        $inc: { balance: amount },
      },
      { new: true, useFindAndModify: false }
    );

    if (!updatedWallet) {
      throw new NotFoundException('Failed to update wallet.');
    }

    return {
      success: true,
      message: 'Deposit successful',
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

  async getWalletBalance(userId: string): Promise<{ balance: number; loanBalance: number }> {
    const wallet = await this.walletModel.findOne({ userId });
  
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
  
    // Return both wallet balance and loan balance
    return {
      balance: wallet.balance,
      loanBalance: wallet.loanBalance || 0, 
    };
  }
  

  async getWallet(userId: string): Promise<WalletDocument> {
    let wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      wallet = new this.walletModel({ userId, balance: 0, loanEligibility: 20000 });
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
  

  async addTransaction(userId: string, transaction: any): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }
    wallet.transactions.push(transaction);
    await wallet.save();

    return wallet;
  }

  async updateLoanEligibility(userId: string, newEligibility: number): Promise<void> {
    await this.walletModel.updateOne(
      { userId },
      { $set: { loanEligibility: newEligibility } }
    );
  }

  async credit(userId: string, amount: number, description: string) {
    const wallet = await this.walletModel.findOne({ userId });
  
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
  
    wallet.balance += amount;
    wallet.transactions.push({ amount, type: TransactionType.REFERRAL_BONUS, timestamp: new Date() });
    await wallet.save();
  }
  

  async transferFunds(userId: string, practitionerId: string, amount: number) {
    const userWallet = await this.walletModel.findOne({ userId });
    const practitionerWallet = await this.walletModel.findOne({ userId: practitionerId });
  
    if (!userWallet || userWallet.balance < amount) {
      throw new ForbiddenException("Insufficient balance in user's wallet");
    }
  
    if (!practitionerWallet) {
      throw new NotFoundException("Practitioner's wallet not found");
    }
  
    userWallet.balance -= amount;
    practitionerWallet.balance += amount;

    userWallet.transactions.push({ amount, type: TransactionType.CONSULTATION_PAYMENT, timestamp: new Date() });
    practitionerWallet.transactions.push({ amount, type: TransactionType.CONSULTATION_FEE, timestamp: new Date() });
    await userWallet.save();
    await practitionerWallet.save();
  }
  


async getTransactionHistorys(userId: string): Promise<{ userId: string; balance: number; transactions: Array<{ amount: number; type: string; timestamp: Date }> }> {
  const wallet = await this.walletModel.findOne({ userId }).lean();

  if (!wallet) {
    throw new NotFoundException('Wallet not found for user');
  }

  return {
    userId: wallet.userId,
    balance: wallet.balance,
    transactions: (wallet.transactions || []).map(transaction => ({
      ...transaction,
      timestamp: transaction.timestamp || new Date(),
    })),
  };
}

  
  
}
