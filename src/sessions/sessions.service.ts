import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schema/session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { User, UserDocument } from 'src/user/Schema/user.schema';
import { WalletService } from 'src/wallet/wallet.service'; 
import { MedicalIssue, MedicalIssueDocument } from 'src/medical-issues/schema/medical-issue.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(MedicalIssue.name) private medicalIssueModel: Model<MedicalIssueDocument>,
    private readonly walletService: WalletService,
  ) {}

  async create(dto: CreateSessionDto): Promise<{ message: string; session: Session }> {
    const { user, medicalPractitioner, medicalIssue } = dto;
  
    const foundUser = await this.userModel.findOne({ _id: user });
    if (!foundUser) {
      throw new NotFoundException('No user found with this ID');
    }
  
    const foundPractitioner = await this.userModel.findById(medicalPractitioner);
    if (!foundPractitioner || foundPractitioner.role !== 'medical_practitioner') {
      throw new BadRequestException('Invalid medical practitioner');
    }
  
    let medicalIssues: MedicalIssueDocument[] = [];
    if (Array.isArray(medicalIssue)) {
      medicalIssues = await this.medicalIssueModel.find({ _id: { $in: medicalIssue } });
      if (medicalIssues.length !== medicalIssue.length) {
        throw new NotFoundException('One or more medical issues not found');
      }
    } else {
      const issue = await this.medicalIssueModel.findById(medicalIssue);
      if (!issue) {
        throw new NotFoundException('Medical issue not found');
      }
      medicalIssues = [issue];
    }
  
    const totalPrice = medicalIssues.reduce((sum, issue) => sum + issue.price, 0);
  
    const wallet = await this.walletService.getWalletByUserId(user);
    if (wallet.balance < totalPrice) {
      throw new BadRequestException('Insufficient balance');
    }
  
    await this.walletService.deductFunds(user, totalPrice);
  
    const issueNames = medicalIssues.map(i => i.name).join(', ');
  
    const transaction = {
      amount: totalPrice,
      timestamp: new Date(),
      type: 'session-payment',
      reason: dto.reason,
      description: `Payment for session with practitioner ${foundPractitioner.firstName} ${foundPractitioner.lastName} regarding ${issueNames}`,
    };
  
    await this.walletService.addTransaction(user, transaction);
  
    dto.price = totalPrice;
    dto.medicalIssue = medicalIssues.map(i => i._id); 
    const session = new this.sessionModel(dto);
    const savedSession = await session.save();
  
    return {
      message: 'Session created successfully',
      session: savedSession,
    };
  }
  
  


  async updateSessionStatus(sessionId: string, status: string): Promise<{ message: string; session: Session }> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
  
    // Handle completion
    if (status === 'completed' && session.status !== 'completed') {
      const practitionerId = session.medicalPractitioner.toString();
      await this.walletService.addFunds(practitionerId, session.price);
  
      const practitioner = await this.userModel.findById(practitionerId);
      const issueNames = await this.medicalIssueModel
        .find({ _id: { $in: session.medicalIssue } })
        .then((issues) => issues.map(i => i.name).join(', '));
  
      await this.walletService.addTransaction(practitionerId, {
        amount: session.price,
        timestamp: new Date(),
        type: 'session-income',
        description: `Received payment for completed session on: ${issueNames}`,
      });
    }
  
    // Handle cancellation and refund
    if (status === 'cancelled' && session.status !== 'cancelled') {
      const userId = session.user.toString();
      await this.walletService.addFunds(userId, session.price);
  
      await this.walletService.addTransaction(userId, {
        amount: session.price,
        timestamp: new Date(),
        type: 'refund',
        description: `Refund for cancelled session`,
      });
    }
  
    session.status = status;
    const updatedSession = await session.save();
  
    return {
      message: `Session status updated to ${status} successfully`,
      session: updatedSession,
    };
  }
  
  
  
}
