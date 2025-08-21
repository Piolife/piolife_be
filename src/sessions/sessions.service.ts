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
import { BookSessionDto, CreateReviewDto } from './dto/create-session.dto';
import { User, UserDocument } from 'src/user/Schema/user.schema';
import { WalletService } from 'src/wallet/wallet.service';
import {
  MedicalIssue,
  MedicalIssueDocument,
} from 'src/medical-issues/schema/medical-issue.schema';
import { UserRole } from 'src/user/enum/user.enum';
import * as moment from 'moment';

import { Review, ReviewDocument } from './schema/review.schema';

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
  ) {}

  // async findMatchingPractitioners(dto: BookSessionDto) {
  //   const query: any = {
  //     role: UserRole.MEDICAL_PRACTITIONER,
  //   };

  //   if (dto.languageProficiency?.length) {
  //     query.languageProficiency = { $in: dto.languageProficiency };
  //   }

  //   if (dto.specialty?.length) {
  //     query.specialty = { $in: dto.specialty };
  //   }

  //   // Check wallet balance
  //   const wallet = await this.walletService.getWalletByUserId(dto.userId);

  //   let specialtyDetails: any[] = [];
  //   if (dto.specialty?.length) {
  //     specialtyDetails = await this.medicalIssueModel.find({
  //       _id: { $in: dto.specialty }, // assuming your generated ID is still stored as _id
  //     });

  //     const totalCost = specialtyDetails.reduce(
  //       (sum, issue) => sum + (issue.price || 0),
  //       0,
  //     );

  //     if (!wallet || wallet.balance < totalCost) {
  //       throw new ForbiddenException(
  //         `Insufficient wallet balance. Required: ${totalCost}`,
  //       );
  //     }
  //   }

  //   const users = await this.userModel
  //     .find(query)
  //     // .sort({ isOnline: -1 })
  //     .lean();
  //   console.log('users', users);
  //   // Create a map of specialties for fast lookup
  //   const specialtyMap = new Map(
  //     specialtyDetails.map((spec) => [spec._id.toString(), spec]),
  //   );

  //   // Replace specialty ID array with full details
  //   const usersWithSpecialtyDetails = users.map((user) => ({
  //     ...user,
  //     specialty: Array.isArray(user.specialty)
  //       ? user.specialty
  //           .map((id) => specialtyMap.get(id.toString()))
  //           .filter(Boolean)
  //       : [],
  //   }));

  //   return usersWithSpecialtyDetails;
  // }
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

    // const usersWithSpecialtyDetails = users.map((user) => ({
    //   ...user,
    //   specialty: Array.isArray(user.specialty)
    //     ? user.specialty
    //         .map((id) => specialtyMap.get(id.toString()))
    //         .filter(Boolean)
    //     : [],
    // }));
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

    console.log('usersWithSpecialtyDetails', usersWithSpecialtyDetails);
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
}
