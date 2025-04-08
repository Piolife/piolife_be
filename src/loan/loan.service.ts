import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Loan, LoanDocument } from './schema/loan.schema';
import { LoanRepayment, LoanRepaymentDocument } from './schema/loanRepayment.schema';
import { WalletService } from 'src/wallet/wallet.service';

interface LoanBalance {
  loanId: string;
  amount: number;
  totalRepaid: number;
  remainingBalance: number;
  status: string;
}

@Injectable()
export class LoanService {
  constructor(
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    @InjectModel(LoanRepayment.name) private repaymentModel: Model<LoanRepaymentDocument>,
    private readonly walletService: WalletService,
  ) {}

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

    // Update loanBalance in wallet schema
    await this.walletService.updateLoanBalance(userId, loan.amount);

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

    // Update loanBalance in wallet schema after repayment
    await this.walletService.updateLoanBalance(userId, remainingBalance);

    return {
      message: remainingBalance === 0 ? 'Loan fully repaid.' : 'Loan repayment successful.',
      totalRepaid: newTotalRepaid,
      remainingBalance,
    };
  }

  async getLoanHistory(userId: string) {
    const loans = await this.loanModel.find({ userId }).lean();
    const repayments = await this.repaymentModel.find({ userId }).lean();
    const wallet = await this.walletService.getWallet(userId); // Fetch wallet details

    // Calculate the loan balances
    const loanBalances = await this.calculateLoanBalances(userId);

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

    history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Return loan balance and wallet balance separately outside the history array
    return {
      userId,
      history,
      loanBalance: {
        remainingBalance: loanBalances.reduce((acc, loan) => acc + loan.remainingBalance, 0), // Total remaining balance of all loans
      },
      walletBalance: wallet.balance,
    };
  }

  async calculateLoanBalances(userId: string): Promise<LoanBalance[]> {
    const loans = await this.loanModel.find({ userId }).lean();
    const loanBalances: LoanBalance[] = [];

    for (const loan of loans) {
      const totalRepaidData = await this.repaymentModel.aggregate([
        { $match: { loanId: loan._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const totalRepaid = totalRepaidData[0]?.total || 0;
      const remainingBalance = loan.amount - totalRepaid;

      loanBalances.push({
        loanId: loan._id,
        amount: loan.amount,
        totalRepaid,
        remainingBalance,
        status: loan.status,
      });
    }

    return loanBalances;
  }
}
