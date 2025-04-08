// wallet.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionType, Wallet, WalletDocument,} from './schema/wallet.schema';
import { User, UserDocument } from 'src/user/Schema/user.schema';


@Injectable()
export class WalletService {
  constructor(@InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
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
  


// async deposit(userId: string, amount: number, reference: string, status: string) {
//     const user = await this.userModel.findById(userId);
//     if (!user) {
//       throw new NotFoundException('User not found.');
//     }
  
//     const wallet = await this.walletModel.findOne({ userId });
//     if (!wallet) {
//       throw new NotFoundException('Wallet not found for user.');
//     }
  
//     // Create new deposit transaction
//     const depositTransaction = {
//       amount,
//       timestamp: new Date(),
//       type: 'deposit',
//       transactionRef: reference,
//       status: status,
//     };
  
//     // Update wallet with new transaction
//     const updatedWallet = await this.walletModel.findOneAndUpdate(
//       { userId },
//       {
//         $push: { transactions: depositTransaction },
//         $inc: { balance: amount },
//       },
//       { new: true, useFindAndModify: false }
//     );
  
//     if (!updatedWallet) {
//       throw new NotFoundException('Failed to update wallet.');
//     }
  
//     return {
//       success: true,
//       message: 'Deposit successful',
//       deposit: depositTransaction,
//     };
//   }
  
  
  // async getWalletByUserId(userId: string): Promise<WalletDocument> {
  //   const wallet = await this.walletModel.findOne({ userId }).exec();
  //   if (!wallet) {
  //     throw new NotFoundException('Wallet not found for user');
  //   }
  //   return wallet;
  // }


  // async getWalletBalance(userId: string): Promise<number> {
  //   const wallet = await this.walletModel.findOne({ userId });

  //   if (!wallet) {
  //     throw new NotFoundException('Wallet not found');
  //   }
  //   return wallet.balance;
  // }

  // async getWallet(userId: string): Promise<WalletDocument> {
  //   let wallet = await this.walletModel.findOne({ userId });
  //   if (!wallet) {
  //     wallet = new this.walletModel({ userId, balance: 0, loanEligibility: 20000 });
  //     await wallet.save();
  //   }
  //   return wallet;
  // }

  // async reduceLoanEligibility(userId: string, amount: number): Promise<Wallet> {
  //   const wallet = await this.getWallet(userId);

  //   if (wallet.loanEligibility < amount) {
  //     throw new Error('You are not eligible for loan at this time');
  //   }
  //   wallet.loanEligibility -= amount;
  //   await wallet.save();
  //   return wallet;
  // }

  // async addFunds(userId: string, amount: number): Promise<Wallet> {
  //   const wallet = await this.getWallet(userId);
  //   wallet.balance += amount;
  //   await wallet.save();
  //   return wallet;
  // }

  // async deductFunds(userId: string, amount: number): Promise<void> {
  //   const wallet = await this.walletModel.findOne({ userId });
  //   if (!wallet) throw new NotFoundException('Wallet not found.');
  //   wallet.balance -= amount;
  //   await wallet.save();
  // }
  
}