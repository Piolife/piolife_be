/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schema/session.schema';
import {
  BookSessionDto,
  CreateConsultationDto,
  CreatePrescriptionDto,
  CreateReviewDto,
} from './dto/create-session.dto';
import { User, UserDocument } from 'src/user/Schema/user.schema';
import { WalletService } from 'src/wallet/wallet.service';
import {
  MedicalIssue,
  MedicalIssueDocument,
} from 'src/medical-issues/schema/medical-issue.schema';
import { UserRole } from 'src/user/enum/user.enum';
import * as moment from 'moment';

import { Review, ReviewDocument } from './schema/review.schema';
import {
  Consultations,
  ConsultationsDocument,
} from './schema/consultations.schema';
import {
  Prescription,
  PrescriptionDocument,
} from './schema/prescription.schema';
import { TransactionType } from 'src/wallet/schema/wallet.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(MedicalIssue.name)
    private medicalIssueModel: Model<MedicalIssueDocument>,
    private readonly walletService: WalletService,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Consultations.name) // 👈 add this
    private readonly consultationModel: Model<ConsultationsDocument>,
    @InjectModel(Prescription.name)
    private readonly prescriptionModel: Model<PrescriptionDocument>,
  ) {}

  async findMatchingPractitioners(dto: BookSessionDto) {
    const query: any = {
      role: UserRole.MEDICAL_PRACTITIONER,
    };

    if (dto.languageProficiency?.length) {
      query.languageProficiency = { $in: dto.languageProficiency };
    }

    if (dto.specialty?.length) {
      query.specialty = { $in: dto.specialty };
    }

    // 🔑 Wallet check
    const wallet = await this.walletService.getWalletByUserId(dto.userId);

    let specialtyDetails: any[] = [];
    if (dto.specialty?.length) {
      specialtyDetails = await this.medicalIssueModel.find({
        _id: { $in: dto.specialty },
      });

      const totalCost = specialtyDetails.reduce(
        (sum, issue) => sum + (issue.price || 0),
        0,
      );

      const availableFunds =
        (wallet?.balance || 0) + (wallet?.loanBalance || 0);

      if (!wallet || availableFunds < totalCost) {
        throw new ForbiddenException(
          `Insufficient wallet funds. Required: ${totalCost}, Available: ${availableFunds}`,
        );
      }
    }

    // ✅ Fetch practitioners (online first)
    const users = await this.userModel
      .find(query)
      .sort({ isOnline: -1 })

      .lean();

    // ✅ Map specialties
    const specialtyMap = new Map(
      specialtyDetails.map((spec) => [spec._id.toString(), spec]),
    );

    const usersWithSpecialtyDetails = users.map((user) => ({
      ...user,
      specialty: Array.isArray(user.specialty)
        ? user.specialty.map((id) => id.toString())
        : [],
      specialtyDetails: Array.isArray(user.specialty)
        ? user.specialty
            .map((id) => specialtyMap.get(id.toString()))
            .filter(Boolean)
        : [],
    }));
    return usersWithSpecialtyDetails;
  }

  async bookSessionWithAnyPractitioner(dto: BookSessionDto) {
    const query: any = {
      role: UserRole.MEDICAL_PRACTITIONER,
    };

    if (dto.languageProficiency?.length) {
      query.languageProficiency = { $in: dto.languageProficiency };
    }

    if (dto.specialty?.length) {
      query.specialty = { $in: dto.specialty };
    }

    const matchedPractitioners = await this.userModel
      .find(query)
      .sort({ isOnline: -1 })

      .lean();

    if (!matchedPractitioners.length) {
      throw new NotFoundException('No matching practitioners found');
    }

    const selectedPractitioner = matchedPractitioners[0];

    const savedSession = await this.saveSession({
      userId: dto.userId,
      practitionerId: selectedPractitioner._id,
      languageProficiency: dto.languageProficiency || [],
      specialty: dto.specialty || [],
      name: dto.name || '',
      age: dto.age || '',
      gender: dto.gender || '',
    });

    return {
      message: 'Session successfully booked',
      session: savedSession,
      practitioner: selectedPractitioner,
    };
  }

  async saveSession(data: BookSessionDto) {
    const session = new this.sessionModel(data);
    return session.save();
  }

  async submitReview(dto: CreateReviewDto, practitionerId: string) {
    const session = await this.sessionModel.findById(dto.sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.practitionerId !== practitionerId) {
      throw new ForbiddenException(
        'You are not authorized to review this session',
      );
    }

    if (session.reviewSubmitted) {
      throw new BadRequestException(
        'Review already submitted for this session',
      );
    }

    // Save review
    await this.reviewModel.create({
      sessionId: dto.sessionId,
      userId: session.userId,
      practitionerId,
      rating: dto.rating,
      review: dto.review,
    });

    // Transfer funds
    const totalCost = session.specialty?.length
      ? (
          await this.medicalIssueModel.find({ _id: { $in: session.specialty } })
        ).reduce((sum, issue) => sum + (issue.price || 0), 0)
      : 0;

    await this.walletService.transferFunds(
      session.userId,
      practitionerId,
      totalCost,
    );

    // Mark session as reviewed and completed
    session.reviewSubmitted = true;
    session.status = 'completed';
    await session.save();

    return { message: 'Review submitted and payment processed' };
  }

  async getPendingSessionsForPractitioner(practitionerId: string) {
    return this.sessionModel
      .find({
        practitionerId,
        reviewSubmitted: false,
        status: 'pending',
      })
      .lean();
  }

  async getSessionsForUser(userId: string) {
    const sessions = await this.sessionModel
      .find({
        $or: [{ userId }, { practitionerId: userId }],
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Collect all unique user + practitioner IDs
    const ids = new Set<string>();
    sessions.forEach((session) => {
      if (session.userId) ids.add(session.userId.toString());
      if (session.practitionerId) ids.add(session.practitionerId.toString());
    });

    // Fetch related users/practitioners with needed fields
    const users = await this.userModel
      .find(
        { _id: { $in: Array.from(ids) } },
        { _id: 1, firstName: 1, lastName: 1, userName: 1, profilePicture: 1 },
      )
      .lean();

    // Map userId => user details
    const userMap = users.reduce(
      (acc, user) => {
        acc[user._id.toString()] = {
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.username,
          profilePicture: user.profilePicture,
        };
        return acc;
      },
      {} as Record<
        string,
        {
          firstName?: string;
          lastName?: string;
          userName?: string;
          profilePicture?: any;
        }
      >,
    );

    // Build result grouped by year/month
    const result: Record<string, Record<string, any[]>> = {};

    sessions.forEach((session) => {
      const date = moment(session.createdAt);
      const year = date.format('YYYY');
      const month = date.format('MMMM');

      const userInfo = userMap[session.userId?.toString()] || {};
      const practitionerInfo =
        userMap[session.practitionerId?.toString()] || {};

      const formattedSession = {
        ...session,
        client: {
          id: session.userId,
          firstName: userInfo.firstName || null,
          lastName: userInfo.lastName || null,
          userName: userInfo.userName || null,
          profilePicture: userInfo.profilePicture || null,
        },
        practitioner: {
          id: session.practitionerId,
          firstName: practitionerInfo.firstName || null,
          lastName: practitionerInfo.lastName || null,
          userName: practitionerInfo.userName || null,
          profilePicture: practitionerInfo.profilePicture || null,
        },
      };

      if (!result[year]) result[year] = {};
      if (!result[year][month]) result[year][month] = [];

      result[year][month].push(formattedSession);
    });

    return result;
  }

  async getSessionsForPractitionerId(practitionerId: string) {
    return this.sessionModel
      .find({ practitionerId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getSessionWithReview(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId).lean();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const review = await this.reviewModel.findOne({ sessionId }).lean();

    return {
      session,
      review: review || null,
    };
  }
  async create(
    createConsultationDto: CreateConsultationDto,
    userId: string,
  ): Promise<Consultations> {
    // Directly create without checking
    const consultation = await this.consultationModel.create({
      ...createConsultationDto,
      userId: userId,
    });

    return consultation;
  }

  // async getConsultationsByUser(userId: string) {
  //   // fetch consultations
  //   const consultations = await this.consultationModel.find({ userId }).lean();

  //   // extract unique user + practitioner IDs
  //   const practitionerIds = consultations.map((c) => c.practitionerId);
  //   const users = await this.userModel
  //     .find({
  //       _id: { $in: [userId, ...practitionerIds] },
  //     })
  //     .lean();

  //   // map for quick lookup
  //   const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  //   // attach user + practitioner details
  //   return consultations.map((c) => ({
  //     ...c,
  //     user: userMap.get(c.userId.toString()) || null,
  //     practitioner: userMap.get(c.practitionerId.toString()) || null,
  //   }));
  // }
  async getConsultationsByUser(userId: string) {
    // fetch consultations
    const consultations = await this.consultationModel.find({ userId }).lean();

    // extract unique practitioner + medical issue IDs
    const practitionerIds = consultations.map((c) => c.practitionerId);
    const medicalIssueIds = consultations.map((c) => c.medicalIssueId);

    // fetch all related users
    const users = await this.userModel
      .find({
        _id: { $in: [userId, ...practitionerIds] },
      })
      .lean();

    // fetch all related medical issues
    const medicalIssues = await this.medicalIssueModel
      .find({
        _id: { $in: medicalIssueIds },
      })
      .lean();

    // create maps for quick lookup
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const issueMap = new Map(medicalIssues.map((m) => [m._id.toString(), m]));

    // attach user + practitioner + medicalIssue details
    return consultations.map((c) => ({
      ...c,
      user: userMap.get(c.userId.toString()) || null,
      practitioner: userMap.get(c.practitionerId.toString()) || null,
      medicalIssue: issueMap.get(c.medicalIssueId.toString()) || null,
    }));
  }

  async getConsultationsByPractitioner(practitionerId: string) {
    const consultations = await this.consultationModel
      .find({ practitionerId })
      .lean();

    const userIds = consultations.map((c) => c.userId);
    const users = await this.userModel
      .find({
        _id: { $in: [practitionerId, ...userIds] },
      })
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return consultations.map((c) => ({
      ...c,
      user: userMap.get(c.userId.toString()) || null,
      practitioner: userMap.get(c.practitionerId.toString()) || null,
    }));
  }

  async createPrescription(
    createPrescriptionDto: CreatePrescriptionDto,
  ): Promise<Prescription> {
    const { userId, practitionerId, medicalIssueId } = createPrescriptionDto;

    if (!userId || !practitionerId) {
      throw new BadRequestException('UserId and PractitionerId are required.');
    }

    // 1. Get medical issue
    const medicalIssue = await this.medicalIssueModel.findById(medicalIssueId);
    if (!medicalIssue) {
      throw new NotFoundException('Medical issue not found.');
    }

    // 2. Get wallets
    const userWallet = await this.walletService.getWalletByUserId(userId);
    const practitionerWallet =
      await this.walletService.getWalletByUserId(practitionerId);

    if (!userWallet || !practitionerWallet) {
      throw new NotFoundException('User or Practitioner wallet not found.');
    }

    // 3. Check user’s balance + loanBalance
    const availableFunds = userWallet.balance;
    if (availableFunds < medicalIssue.price) {
      throw new BadRequestException('Insufficient balance ');
    }

    // 4. Debit from user wallet
    let remainingDebit = medicalIssue.price;

    if (userWallet.balance >= remainingDebit) {
      // fully deduct from balance
      userWallet.balance -= remainingDebit;
      remainingDebit = 0;
    }

    userWallet.transactions.push({
      amount: medicalIssue.price,
      type: TransactionType.CONSULTATION_PAYMENT,
      reason: 'Prescription consultation',
      description: `Paid for medical issue: ${medicalIssue.name}`,
      timestamp: new Date(),
    });

    await userWallet.save();

    // 5. Credit practitioner wallet
    practitionerWallet.balance += medicalIssue.price;
    practitionerWallet.transactions.push({
      amount: medicalIssue.price,
      type: TransactionType.CONSULTATION_FEE,
      reason: 'Consultation fee received',
      description: `Received consultation payment from user: ${userId}`,
      timestamp: new Date(),
    });

    await practitionerWallet.save();

    // 6. Save consultation record
    await this.consultationModel.create({
      userId,
      practitionerId,
      medicalIssueId,
      amount: medicalIssue.price,
      status: 'completed',
    });

    // 6b. Increment consultationCount for practitioner
    await this.userModel.updateOne(
      { _id: practitionerId },
      { $inc: { consultationCount: 1 } },
    );

    // 7. Create prescription
    const prescription = new this.prescriptionModel(createPrescriptionDto);
    return prescription.save();
  }

  async getPrescriptionsByUser(userId: string) {
    // Fetch prescriptions for this user
    const prescriptions = await this.prescriptionModel.find({ userId }).lean();

    // Collect practitioner IDs from prescriptions
    const practitionerIds = prescriptions.map((p) => p.practitionerId);

    // Fetch all practitioners in one query
    const practitioners = await this.userModel
      .find({ _id: { $in: practitionerIds } })
      .lean();

    // Map for quick lookup
    const practitionerMap = new Map(
      practitioners.map((p) => [p._id.toString(), p]),
    );

    // Attach practitioner details
    return prescriptions.map((p) => ({
      ...p,
      practitioner: practitionerMap.get(p.practitionerId.toString()) || null,
    }));
  }

  async getPrescriptionsByPractitioner(practitionerId: string) {
    // Fetch prescriptions written by this practitioner
    const prescriptions = await this.prescriptionModel
      .find({ practitionerId })
      .lean();

    // Collect user IDs from prescriptions
    const userIds = prescriptions.map((p) => p.userId);

    // Fetch all users in one query
    const users = await this.userModel.find({ _id: { $in: userIds } }).lean();

    // Map for quick lookup
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Attach user details
    return prescriptions.map((p) => ({
      ...p,
      user: userMap.get(p.userId.toString()) || null,
    }));
  }
}
