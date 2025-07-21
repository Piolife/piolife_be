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

  // async requestLoan(userId: string, amount: number): Promise<Loan> {
  //   const wallet = await this.walletService.getWallet(userId);
  
  //   // Check if user has any unpaid (active) loan
  //   const activeLoan = await this.loanModel.findOne({
  //     userId,
  //     status: 'approved',
  //   });
  
  //   if (activeLoan) {
  //     // Check if the loan is fully repaid by aggregating repayments
  //     const totalRepaidData = await this.repaymentModel.aggregate([
  //       { $match: { loanId: activeLoan._id.toString() } },
  //       { $group: { _id: null, total: { $sum: '$amount' } } },
  //     ]);
  
  //     const totalRepaid = totalRepaidData[0]?.total || 0;
  
  //     if (totalRepaid < activeLoan.amount) {
  //       const remaining = activeLoan.amount - totalRepaid;
  //       throw new BadRequestException(`You have an active loan with ₦${remaining} remaining. Please repay it before requesting a new one.`);
  //     } else {
  //       // Optional: update loan status to repaid if fully paid
  //       activeLoan.status = 'paid';
  //       await activeLoan.save();
  //     }
  //   }
  
  //   if (wallet.loanEligibility < amount) {
  //     throw new BadRequestException(
  //       `Requested amount exceeds eligibility. You are eligible to loan ₦${wallet.loanEligibility}`,
  //     );
  //   }
  
  //   // Create and approve loan instantly
  //   const dueDate = new Date();
  //   dueDate.setDate(dueDate.getDate() + 30);
  
  //   const loan = await this.loanModel.create({
  //     userId,
  //     amount,
  //     status: 'approved',
  //     dueDate,
  //   });
  
  //   await loan.save();
  
  //   await this.walletService.reduceLoanEligibility(userId, amount);
  //   await this.walletService.addFunds(userId, amount);
  
  //   await this.walletService.addTransaction(userId, {
  //     amount,
  //     timestamp: new Date(),
  //     type: 'loan',
  //     description: 'Loan approved',
  //   });
  
  //   await this.walletService.updateLoanBalance(userId, loan.amount);
  
  //   return loan;
  // }


  async requestLoan(userId: string, amount: number): Promise<Loan> {
    const wallet = await this.walletService.getWallet(userId);
  
    // Check for existing unpaid loan
    const activeLoan = await this.loanModel.findOne({
      userId,
      status: 'approved',
    });
  
    if (activeLoan) {
      const totalRepaidData = await this.repaymentModel.aggregate([
        { $match: { loanId: activeLoan._id.toString() } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
  
      const totalRepaid = totalRepaidData[0]?.total || 0;
  
      if (totalRepaid < activeLoan.totalRepayableAmount) {
        const remaining = activeLoan.totalRepayableAmount - totalRepaid;
        throw new BadRequestException(
          `You have an active loan with ₦${remaining} remaining. Please repay it before requesting a new one.`
        );
      } else {
        activeLoan.status = 'paid';
        await activeLoan.save();
      }
    }
  
    if (wallet.loanEligibility < amount) {
      throw new BadRequestException(
        `Requested amount exceeds eligibility. You are eligible to loan ₦${wallet.loanEligibility}`
      );
    }
  
    // 3% interest
    const interest = parseFloat((amount * 0.03).toFixed(2));
    const totalRepayableAmount = parseFloat((amount + interest).toFixed(2));
  
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
  
    const loan = await this.loanModel.create({
      userId,
      amount,
      interest, 
      totalRepayableAmount,
      status: 'approved',
      dueDate,
    });
  
    await loan.save();
  
    await this.walletService.reduceLoanEligibility(userId, amount);
    await this.walletService.addFunds(userId, amount);
  
    await this.walletService.addTransaction(userId, {
      amount,
      timestamp: new Date(),
      type: 'loan',
      description: `Loan approved with 3% interest and your wallet has been credited with ${amount}.`,
    });
  
    await this.walletService.updateLoanBalance(userId, totalRepayableAmount);
  
    return loan;
  }
  
  async repayLoan(
    userId: string,
    loanId: string,
    amount: number,
  ): Promise<{ message: string; totalRepaid: number; remainingBalance: number }> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found.');
    if (loan.userId.toString() !== userId) throw new BadRequestException('Loan does not belong to this user.');
  
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) throw new NotFoundException('Wallet not found.');
    if (wallet.balance < amount) throw new BadRequestException('Insufficient wallet balance.');
  
    // Get total already repaid
    const totalRepaidData = await this.repaymentModel.aggregate([
      { $match: { loanId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRepaid = totalRepaidData[0]?.total || 0;
  
    if (totalRepaid >= loan.amount) {
      throw new BadRequestException('Loan is already fully repaid.');
    }
  
    const newTotalRepaid = totalRepaid + amount;
    if (newTotalRepaid > loan.amount) {
      throw new BadRequestException('Repayment exceeds loan amount.');
    }
  
    // Deduct funds from wallet
    await this.walletService.deductFunds(userId, amount);
  
    const remainingBalance = loan.amount - newTotalRepaid;
  
    // Save repayment record
    await this.repaymentModel.create({
      userId,
      loanId,
      amount,
      totalPaid: newTotalRepaid,
      remainingBalance,
      repaymentDate: new Date(),
    });
  
    // Subtract from loan balance
    await this.walletService.reduceLoanBalance(userId, amount);
  
    // Add transaction
    await this.walletService.addTransaction(userId, {
      amount,
      timestamp: new Date(),
      type: 'loan repayment',
      description: `Loan repayment of ₦${amount} made. Remaining loan balance: ₦${remainingBalance}`,
    });
  
    // 🆕 Reset eligibility if loan is fully repaid
    if (remainingBalance === 0) {
      const defaultEligibility = 20000;
      await this.walletService.updateLoanEligibility(userId, defaultEligibility);
  
      // Optionally mark the loan as paid
      loan.status = 'paid';
      await loan.save();
    }
    return {
      message: remainingBalance === 0 ? 'Loan fully repaid.' : 'Loan repayment successful.',
      totalRepaid: newTotalRepaid,
      remainingBalance,
    };
  }
  
  async getLoanHistory(userId: string) {
    const loans = await this.loanModel.find({ userId }).lean();
    const repayments = await this.repaymentModel.find({ userId }).lean();
    const wallet = await this.walletService.getWallet(userId); 

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

  async getUserLoansWithBalance(userId: string): Promise<any[]> {
    const loans = await this.loanModel.find({ userId });
  
    if (!loans.length) return [];
  
    const result = await Promise.all(
      loans.map(async (loan) => {
        // Get total repaid for this loan
        const repaidData = await this.repaymentModel.aggregate([
          { $match: { loanId: loan._id.toString() } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
  
        const totalRepaid = repaidData[0]?.total || 0;
        const remainingBalance = Math.max(loan.amount - totalRepaid, 0);
  
        return {
          ...loan.toObject(),
          totalRepaid,
          remainingBalance,
        };
      }),
    );
  
    return result;
  }
  
  
}
