/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prefer-const */
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './Schema/user.schema';
import { UserRole } from './enum/user.enum';
import { CreateUserDto } from './dto/user.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/services/email/email.sevice';
import { WalletService } from 'src/wallet/wallet.service';
import { SnowflakeIdGenerator } from 'utils/idGenerator';
import { getDistanceFromLatLonInKm } from 'utils/haversine';
import { UpdateUserDto } from './dto/update-user.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

const snowflakeIdGenerator = new SnowflakeIdGenerator();

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    // private readonly walletService: WalletService,
    private emailService: EmailService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ message: string; token: string; otp: string }> {
    let {
      email,
      role,
      password,
      phoneNumber,
      profilePicture,
      degreeCertificate,
      currentPracticeLicense,
      referralCode,
    } = createUserDto;

    // Normalize
    email = email.toLowerCase().trim();
    phoneNumber = phoneNumber.trim();
    const normalizedRole = role?.toString().trim().toLowerCase();
    if (!Object.values(UserRole).includes(normalizedRole as UserRole)) {
      throw new BadRequestException('Invalid role specified.');
    }

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ role, email }).exec();
    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists for the selected role.',
      );
    }

    // Role-based validation
    const validationRules = {
      [UserRole.CLIENT]: {
        prohibitedFields: [
          'bankDetails',
          'degreeCertificate',
          'currentPracticeLicense',
          'specialty',
          'ward',
          'localGovernmentArea',
          'hospitalName',
          'officerInCharge',
          'languageProficiency',
        ],
        requiredFields: [
          'profilePicture',
          'firstName',
          'lastName',
          'email',
          'password',
          'phoneNumber',
          'gender',
          'maritalStatus',
          'dateOfBirth',
          'countryOfResidence',
          'countryOfOrigin',
          'stateOfResidence',
          'stateOfOrigin',
        ],
      },
      [UserRole.MEDICAL_PRACTITIONER]: {
        prohibitedFields: [
          'ward',
          'localGovernmentArea',
          'hospitalName',
          'officerInCharge',
        ],
        requiredFields: [
          'profilePicture',
          'firstName',
          'lastName',
          'email',
          'password',
          'phoneNumber',
          'specialty',
          'gender',
          'maritalStatus',
          'dateOfBirth',
          'countryOfResidence',
          'countryOfOrigin',
          'stateOfResidence',
          'stateOfOrigin',
          'languageProficiency',
          'bankDetails',
        ],
        mustHaveFiles: { degreeCertificate, currentPracticeLicense },
      },
      [UserRole.EMERGENCY_SERVICES]: {
        prohibitedFields: [
          'firstName',
          'lastName',
          'specialty',
          'languageProficiency',
          'gender',
          'maritalStatus',
          'dateOfBirth',
        ],
        requiredFields: [
          'hospitalName',
          'officerInCharge',
          'bankDetails',
          'ward',
          'localGovernmentArea',
          'stateOfResidence',
          'alternativePhoneNumber',
          'email',
          'password',
          'latitude',
          'longitude',
        ],
      },
      [UserRole.PHAMACY_SERVICES]: {
        prohibitedFields: ['profilePicture'],
        requiredFields: [
          'pharmacyName',
          'logo',
          'stateOfResidence',
          'phoneNumber',
          'localGovernmentArea',
          'ward',
          'alternativePhoneNumber',
          'officerInCharge',
          'latitude',
          'longitude',
          'bankDetails',
        ],
      },

      [UserRole.MEDICAL_LAB_SERVICES]: {
        prohibitedFields: ['profilePicture'],
        requiredFields: [
          'medicalLabName',
          'logo',
          'stateOfResidence',
          'phoneNumber',
          'localGovernmentArea',
          'ward',
          'alternativePhoneNumber',
          'officerInCharge',
          'latitude',
          'longitude',
          'bankDetails',
        ],
      },
    };

    const rules = validationRules[role];
    if (rules) {
      for (const field of rules.prohibitedFields || []) {
        if (createUserDto[field]) {
          throw new BadRequestException(
            `${field.replace(/([A-Z])/g, ' $1')} is not required for this role.`,
          );
        }
      }

      for (const field of rules.requiredFields || []) {
        if (!createUserDto[field]) {
          throw new BadRequestException(
            `${field.replace(/([A-Z])/g, ' $1')} is required.`,
          );
        }
      }

      if (rules.mustHaveFiles) {
        for (const [key, value] of Object.entries(rules.mustHaveFiles)) {
          if (!value) {
            throw new BadRequestException(
              `${key.replace(/([A-Z])/g, ' $1')} is required.`,
            );
          }
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique username (this will now be used as referral code)
    let username: string;

    if (
      role === UserRole.PHAMACY_SERVICES ||
      role === UserRole.MEDICAL_LAB_SERVICES ||
      role === UserRole.EMERGENCY_SERVICES
    ) {
      const facilityId = this.generateFacilityId(createUserDto, role);
      username = facilityId;
    } else {
      username = await this.generateUniqueUsername(createUserDto.firstName);
    }

    // Create user
    const user = new this.userModel({
      _id: snowflakeIdGenerator.generate(),
      ...createUserDto,
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      profilePicture,
      degreeCertificate,
      currentPracticeLicense,
      policyAgreement:
        role === UserRole.MEDICAL_PRACTITIONER
          ? true
          : createUserDto.policyAgreement,
    });

    const createdUser = await user.save();

    // Handle referral
    if (referralCode) {
      const referrer = await this.userModel.findOne({ username: referralCode });

      if (referrer) {
        await this.walletService.credit(referrer._id, 1000, 'Referral bonus');
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        await referrer.save();
      }
    }

    // OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpToken = this.jwtService.sign(
      { userId: createdUser._id, otp },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '30m',
      },
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const otpLink = `${frontendUrl}/api/signup/verify-email?token=${encodeURIComponent(otpToken)}&otp=${encodeURIComponent(otp)}`;

    await this.emailService.sendConfirmationEmail(
      createdUser.email,
      createUserDto.firstName,
      otp,
      otpLink,
    );
    await this.walletService.createWallet(createdUser._id);

    return {
      message: 'Account created successfully. Please verify your email.',
      token: otpToken,
      otp,
    };
  }

  private generateFacilityId(
    createUserDto: CreateUserDto,
    role: UserRole,
  ): string {
    const {
      stateOfResidence,
      phoneNumber,
      localGovernmentArea,
      alternativePhoneNumber,
      ward,
      pharmacyName,
      medicalLabName,
    } = createUserDto;

    const stateCode = stateOfResidence?.slice(0, 2).toUpperCase() || '';
    const phoneSuffix = phoneNumber?.slice(-4) || '';
    const altPhoneSuffix = alternativePhoneNumber?.slice(-4) || '';
    const lga = localGovernmentArea?.replace(/\s+/g, '')?.toLowerCase() || '';
    const wardName = ward?.replace(/\s+/g, '')?.toLowerCase() || '';
    const name =
      role === UserRole.PHAMACY_SERVICES
        ? pharmacyName?.replace(/\s+/g, '')?.toLowerCase() || ''
        : medicalLabName?.replace(/\s+/g, '')?.toLowerCase() || '';

    return `${stateCode}${phoneSuffix}${lga}${altPhoneSuffix}${wardName}${name}`;
  }

  private async generateUniqueUsername(firstName: string): Promise<string> {
    const base = firstName.trim().toLowerCase().slice(0, 2);
    let username;
    let exists = true;

    while (exists) {
      const suffix = Math.floor(100000 + Math.random() * 900000);
      username = `${base}${suffix}`;
      exists = (await this.userModel.exists({ username })) !== null;
    }

    return username;
  }

  async verifyEmail(token?: string, otp?: string): Promise<any> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    if (!otp) {
      throw new BadRequestException('OTP is required');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new BadRequestException('JWT secret is not configured');
      }

      // Verify the token
      const decoded = this.jwtService.verify(token, { secret });
      const user = await this.userModel.findById(decoded.userId).exec();

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.isVerified) {
        throw new BadRequestException('Email already verified');
      }

      // If OTP is provided (via a form), validate it
      if (otp && otp !== decoded.otp) {
        throw new BadRequestException('Invalid OTP');
      }
      user.isVerified = true;
      await user.save();

      this.logger.log(`Email verified successfully for user: ${user.email}`);
      return {
        message: 'Email verified successfully',
        userId: user._id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error verifying token or OTP', error);
      throw new BadRequestException('Invalid or expired token');
    }
  }

  // async findUserByEmail(email: string): Promise<User> {
  //   const user = await this.userModel
  //     .findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
  //     .exec();
  //   if (!user) {
  //     throw new NotFoundException(`User with email ${email} not found`);
  //   }
  //   return user;
  // }
  async findUserByEmail(email: string, role: UserRole): Promise<User> {
    const user = await this.userModel
      .findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') },
        role,
      })
      .exec();

    if (!user) {
      throw new NotFoundException(
        `User with email ${email} and role ${role} not found`,
      );
    }

    return user;
  }

  async login({ email }: { email: string }): Promise<any> {
    const userExists = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
    });

    if (!userExists) {
      return { message: 'User not found' };
    } else {
      return userExists;
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isOnline = false;
    await user.save();

    return { message: 'Logout successful, user marked as offline' };
  }

  async setUserOnlineStatus(userId: string, isOnline: boolean) {
    await this.userModel.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date(),
    });
  }

  async requestPasswordReset(
    email: string,
    role?:
      | 'client'
      | 'medical_practitioner'
      | 'emergency_services'
      | 'real_estate_services'
      | 'insurance_services',
  ): Promise<{ message: string }> {
    if (!role) {
      throw new BadRequestException('Role is required');
    }

    const user = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      role,
    });

    if (!user) {
      throw new NotFoundException(
        'User does not have an account with this role',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await (this.cacheManager as any).set(`otp:${user._id}`, otpHash, {
      ttl: 600,
    });

    await this.emailService.SendResetPassword(user.email, otp, '');

    return { message: 'OTP sent to your email address' };
  }

  // async verifyResetOtp(email: string, otp: string): Promise<{ token: string }> {
  //   const user = await this.userModel.findOne({
  //     email: { $regex: new RegExp(`^${email}$`, 'i') },
  //   });

  //   if (!user) throw new NotFoundException('User not found');

  //   const storedOtpHash = await (this.cacheManager as any).get(
  //     `otp:${user._id}`,
  //   );
  //   if (!storedOtpHash) throw new BadRequestException('OTP expired or invalid');

  //   const isValid = await bcrypt.compare(otp, storedOtpHash);
  //   if (!isValid) throw new BadRequestException('Incorrect OTP');

  //   // Remove used OTP
  //   await (this.cacheManager as any).del(`otp:${user._id}`);

  //   // Issue short-lived token (e.g., 15 mins) to reset password
  //   const token = this.jwtService.sign(
  //     { userId: user._id },
  //     { expiresIn: '15m' },
  //   );

  //   return { token };
  // }
  async verifyResetOtp(
    email: string,
    otp: string,
    role:
      | 'client'
      | 'medical_practitioner'
      | 'emergency_services'
      | 'real_estate_services'
      | 'insurance_services',
  ): Promise<{ token: string }> {
    if (!role) {
      throw new BadRequestException('Role is required');
    }

    const user = await this.userModel.findOne({
      email: email.toLowerCase(), // assumes you store lowercase emails
      role,
    });

    if (!user) throw new NotFoundException('User not found with this role');

    const storedOtpHash = await (this.cacheManager as any).get(
      `otp:${user._id}`,
    );
    if (!storedOtpHash) throw new BadRequestException('OTP expired or invalid');

    const isValid = await bcrypt.compare(otp, storedOtpHash);
    if (!isValid) throw new BadRequestException('Incorrect OTP');

    // Remove used OTP
    await (this.cacheManager as any).del(`otp:${user._id}`);

    // Issue short-lived token (purpose claim is safer!)
    const token = this.jwtService.sign(
      { userId: user._id, role, purpose: 'reset_password' },
      { expiresIn: '15m' },
    );

    return { token };
  }

  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.userModel.findById(decoded.userId);

      if (!user) throw new NotFoundException('User not found');

      user.password = await bcrypt.hash(password, 10);
      await user.save();

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async getUserById(userId: string): Promise<User> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure bankDetails is properly parsed
    if (user.bankDetails && typeof user.bankDetails === 'string') {
      try {
        user.bankDetails = JSON.parse(user.bankDetails);
      } catch (error) {
        throw new InternalServerErrorException('Invalid bank details format');
      }
    }

    return user;
  }

  async findAllMedicalPractitioners(languages?: string[]): Promise<User[]> {
    const query: any = { role: 'medical_practitioner' };

    if (languages?.length) {
      query.languageProficiency = { $in: languages };
    }

    return this.userModel.find(query).select('-password').exec();
  }

  async findNearbySpecializedUsers(
    lat: number,
    lng: number,
    radiusKm = 50,
    rolesToInclude: UserRole[] = [
      UserRole.PHAMACY_SERVICES,
      UserRole.MEDICAL_LAB_SERVICES,
    ],
  ): Promise<(User & { distance: number })[]> {
    const users = await this.userModel
      .find({
        role: { $in: rolesToInclude },
      })
      .select('-password')
      .exec();

    const nearbyUsers: (User & { distance: number })[] = [];

    for (const user of users) {
      if (
        typeof user.latitude !== 'number' ||
        typeof user.longitude !== 'number'
      )
        continue;

      const distance = getDistanceFromLatLonInKm(
        lat,
        lng,
        user.latitude,
        user.longitude,
      );

      if (distance <= radiusKm) {
        nearbyUsers.push({ ...user.toObject(), distance });
      }
    }

    nearbyUsers.sort((a, b) => a.distance - b.distance);

    return nearbyUsers;
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateUserDto, {
        new: true,
        runValidators: true,
      })
      .select('-password');

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return updatedUser;
  }
}
