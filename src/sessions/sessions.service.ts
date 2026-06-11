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

  async findMatchingPractitioners(dto: BookSessionDto): Promise<any> {
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
        _id: { $in: dto.specialty } as any,
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
          await this.medicalIssueModel.find({ _id: { $in: session.specialty } as any })
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
        { _id: { $in: Array.from(ids) } as any },
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
    // Just record the consultation — no wallet deduction here.
    // Wallet is debited by the frontend BEFORE the call starts (pay4Consultation.tsx)
    // and again credited to the practitioner inside createPrescription().
    const consultation = await this.consultationModel.create({
      ...createConsultationDto,
      userId,
      status: createConsultationDto.status ?? 'pending',
    });
    return consultation;
  }

  async getConsultationsByUser(userId: string): Promise<any> {
    // fetch consultations
    const consultations = await this.consultationModel.find({ userId }).lean();

    // extract unique practitioner + medical issue IDs (may be absent for
    // payment-only consultations awaiting a practitioner match)
    const practitionerIds = consultations
      .map((c) => c.practitionerId)
      .filter(Boolean);
    const medicalIssueIds = consultations
      .map((c) => c.medicalIssueId)
      .filter(Boolean);

    // fetch all related users
    const users = await this.userModel
      .find({
        _id: { $in: [userId, ...practitionerIds] } as any,
      })
      .lean();

    // fetch all related medical issues
    const medicalIssues = await this.medicalIssueModel
      .find({
        _id: { $in: medicalIssueIds } as any,
      })
      .lean();

    // create maps for quick lookup
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const issueMap = new Map(medicalIssues.map((m) => [m._id.toString(), m]));

    // attach user + practitioner + medicalIssue details
    return consultations.map((c) => ({
      ...c,
      user: userMap.get(c.userId.toString()) || null,
      practitioner: c.practitionerId
        ? userMap.get(c.practitionerId.toString()) || null
        : null,
      medicalIssue: c.medicalIssueId
        ? issueMap.get(c.medicalIssueId.toString()) || null
        : null,
    }));
  }

  async getConsultationsByPractitioner(practitionerId: string): Promise<any> {
    const consultations = await this.consultationModel
      .find({ practitionerId })
      .lean();

    const userIds = consultations.map((c) => c.userId);
    const users = await this.userModel
      .find({
        _id: { $in: [practitionerId, ...userIds] } as any,
      })
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return consultations.map((c) => ({
      ...c,
      user: userMap.get(c.userId.toString()) || null,
      practitioner: c.practitionerId
        ? userMap.get(c.practitionerId.toString()) || null
        : null,
    }));
  }

  async createPrescription(dto: CreatePrescriptionDto): Promise<Prescription> {
    // patientId is an alias for userId sent by writePrescription.tsx
    const userId = dto.userId ?? dto.patientId;
    const { practitionerId, medicalIssueId } = dto;

    if (!userId || !practitionerId) {
      throw new BadRequestException('UserId and PractitionerId are required.');
    }

    // Normalise field aliases from frontend
    const complain = dto.complaint ?? dto.complain ?? '';
    const advice = dto.prognosis ?? dto.advice ?? '';
    const diagnosis = dto.diagnosis ?? '';

    // Credit practitioner wallet (patient already paid via /wallet/:id/deduct)
    const practitionerWallet =
      await this.walletService.getWalletByUserId(practitionerId);
    if (!practitionerWallet) {
      throw new NotFoundException('Practitioner wallet not found.');
    }

    let feeAmount = 0;
    if (medicalIssueId) {
      const medicalIssue =
        await this.medicalIssueModel.findById(medicalIssueId);
      feeAmount = medicalIssue?.price ?? 0;
    }

    if (feeAmount > 0) {
      practitionerWallet.balance += feeAmount;
      practitionerWallet.transactions.push({
        amount: feeAmount,
        type: TransactionType.CONSULTATION_FEE,
        description: `Consultation fee from patient ${userId}`,
        timestamp: new Date(),
      });
      await practitionerWallet.save();

      // Increment consultation count
      await this.userModel.updateOne(
        { _id: practitionerId as any },
        { $inc: { consultationCount: 1 } },
      );
    }

    // Mark the consultation as completed
    if (dto.consultationId) {
      await this.consultationModel.findByIdAndUpdate(dto.consultationId, {
        status: 'completed',
      });
    }

    // Save the prescription with all fields
    const prescription = new this.prescriptionModel({
      userId,
      practitionerId,
      medicalIssueId: medicalIssueId ?? null,
      consultationId: dto.consultationId ?? null,
      complain,
      complaint: dto.complaint ?? '',
      diagnosis,
      prescription: dto.prescription,
      advice,
      prognosis: dto.prognosis ?? '',
      referral: dto.referral ?? '',
    });

    return prescription.save();
  }

  async getPrescriptionsByUser(userId: string): Promise<any> {
    // Fetch prescriptions for this user
    const prescriptions = await this.prescriptionModel.find({ userId }).lean();

    // Collect practitioner IDs from prescriptions
    const practitionerIds = prescriptions.map((p) => p.practitionerId);

    // Fetch all practitioners in one query
    const practitioners = await this.userModel
      .find({ _id: { $in: practitionerIds } as any })
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

  async getPrescriptionsByPractitioner(practitionerId: string): Promise<any> {
    // Fetch prescriptions written by this practitioner
    const prescriptions = await this.prescriptionModel
      .find({ practitionerId })
      .lean();

    // Collect user IDs from prescriptions
    const userIds = prescriptions.map((p) => p.userId);

    // Fetch all users in one query
    const users = await this.userModel.find({ _id: { $in: userIds } as any }).lean();

    // Map for quick lookup
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Attach user details
    return prescriptions.map((p) => ({
      ...p,
      user: userMap.get(p.userId.toString()) || null,
    }));
  }
}
