import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Loan, LoanDocument } from './schema/loan.schema';
import { WalletService } from 'src/wallet/wallet.service';

import { LoanRepayment, LoanRepaymentDocument } from './schema/loanRepayment.schema';

@Injectable()
export class LoanService {
  constructor(@InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
  @InjectModel(LoanRepayment.name) private repaymentModel: Model<LoanRepaymentDocument>,
  private readonly walletService: WalletService,) {}

  async requestLoan(userId: string, amount: number): Promise<Loan> {
    const wallet = await this.walletService.getWallet(userId);
  
    if (wallet.loanEligibility < amount) {
        throw new BadRequestException(`Requested amount exceeds eligibility. You are eligible to loan ${wallet.loanEligibility}`);
      }
  
    // Create and approve loan instantly
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create loan entry in DB
    const loan = await this.loanModel.create({
      userId,
      amount,
      status: 'approved',
      dueDate,  
    });
  
    await loan.save();
  
    // Deduct eligibility and add funds to wallet
    await this.walletService.reduceLoanEligibility(userId, amount);
    await this.walletService.addFunds(userId, amount);
  
    return loan;
  }



  async repayLoan(userId: string, loanId: string, amount: number): Promise<{ message: string; totalRepaid: number; remainingBalance: number }> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found.');
    if (loan.userId !== userId) throw new BadRequestException('Loan does not belong to this user.');
  
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) throw new NotFoundException('Wallet not found.');
    if (wallet.balance < amount) throw new BadRequestException('Insufficient balance.');
  
    // Calculate total repaid amount so far
    const totalRepaidData = await this.repaymentModel.aggregate([
      { $match: { loanId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
  
    const totalRepaid = totalRepaidData[0]?.total || 0;
    if (totalRepaid >= loan.amount) {
      throw new BadRequestException('Loan is already fully repaid.');
    }
  
    // Ensure the new payment does not exceed the loan amount
    const newTotalRepaid = totalRepaid + amount;
    if (newTotalRepaid > loan.amount) {
      throw new BadRequestException('Repayment exceeds loan amount.');
    }
  
    // Deduct funds from wallet
    await this.walletService.deductFunds(userId, amount);
  
    // Calculate remaining loan balance
    const remainingBalance = loan.amount - newTotalRepaid;
  
    // Store repayment record with total paid and remaining balance
    const repayment = await this.repaymentModel.create({
      userId,
      loanId,
      amount,
      totalPaid: newTotalRepaid,
      remainingBalance,
      repaymentDate: new Date(),
    });
  
    await repayment.save();
  
    return {
      message: remainingBalance === 0 ? 'Loan fully repaid.' : 'Loan repayment successful.',
      totalRepaid: newTotalRepaid,
      remainingBalance,
    };
  }


  async getLoanHistory(userId: string) {
    // Fetch all loans requested by the user
    const loans = await this.loanModel.find({ userId }).lean();
  
    // Fetch all repayments made by the user
    const repayments = await this.repaymentModel.find({ userId }).lean();
  
    // Format both loans and repayments into a single timeline
    const history = [
      ...loans.map(loan => ({
        type: 'loan',
        loanId: loan._id,
        amount: loan.amount,
        status: loan.status,
        dueDate: loan.dueDate,
        createdAt: loan.createdAt,
      })),
      ...repayments.map(rep => ({
        type: 'repayment',
        loanId: rep.loanId,
        repaymentId: rep._id,
        amountPaid: rep.amount,
        totalPaid: rep.totalPaid,
        remainingBalance: rep.remainingBalance,
        createdAt: rep.repaymentDate,
      })),
    ];
  
    // Sort by `createdAt` timestamp (earliest first)
    history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
    return { userId, history };
  }
  
  
  

}
