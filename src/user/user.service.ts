import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './Schema/user.schema';
import { UserRole } from './enum/user.enum';
import { CreateUserDto } from './dto/user.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from 'src/services/cloudinary/cloudinary.service';
import { EmailService } from 'src/services/email/email.sevice';
import { WalletService } from 'src/wallet/wallet.service';


@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly cloudinaryService: CloudinaryService,
  private emailService: EmailService,
  private readonly walletService: WalletService,
  ) {}


  // async createUser(
  //   files: { 
  //     profileImage?: Express.Multer.File[]; 
  //     degreeCertificate?: Express.Multer.File[]; 
  //     currentPracticeLicense?: Express.Multer.File[];
  //   }, 
  //   createUserDto: CreateUserDto
  // ): Promise<{ message: string; token: string; otp: string }> {
  
  //   let profileImageUrl = '';
  //   let degreeCertificateUrl = '';
  //   let currentPracticeLicenseUrl = '';

  //   if (!files.profileImage || files.profileImage.length === 0) {
  //     throw new BadRequestException('Profile Image is required.');
  //   }
  
  //   // Upload and assign each file separately
  //   if (files.profileImage && files.profileImage.length > 0) {
  //     const uploadedProfile = await this.cloudinaryService.uploadFile(files.profileImage[0]);
  //     profileImageUrl = uploadedProfile.secure_url;
  //   }
  
  //   if (files.degreeCertificate && files.degreeCertificate.length > 0) {
  //     const uploadedDegree = await this.cloudinaryService.uploadFile(files.degreeCertificate[0]);
  //     degreeCertificateUrl = uploadedDegree.secure_url;
  //   }
  
  //   if (files.currentPracticeLicense && files.currentPracticeLicense.length > 0) {
  //     const uploadedLicense = await this.cloudinaryService.uploadFile(files.currentPracticeLicense[0]);
  //     currentPracticeLicenseUrl = uploadedLicense.secure_url;
  //   }
  
  //   const { email, role, password} = createUserDto;
  
  //   const existingUser = await this.userModel.findOne({ role, email: email.toLowerCase() }).exec();
  //   if (existingUser) {
  //     throw new ConflictException('User with the same email already exists');
  //   }

  //   if (role === UserRole.CLIENT) {
  //     const prohibitedFields = {
  //       bankDetails: 'Bank Details',
  //       degreeCertificateUrl: 'Degree Certificate',
  //       currentPracticeLicenseUrl: 'Current Practice License',
  //       specialty: 'Area of Specialty',
  //       ward: 'Ward',
  //       localGovernmentArea: 'Local Government Area',
  //       hospitalName: 'Hospital Name',
  //       officerInCharge: 'Officer In Charge',
  //       languageProficiency: 'Language Proficiency',
  //     };
    
  //     for (const [key, message] of Object.entries(prohibitedFields)) {
  //       if (createUserDto[key]) {
  //         throw new BadRequestException(`${message} not required for this role.`);
  //       }
  //     }
  //   }
    
    // if (role === UserRole.CLIENT && degreeCertificateUrl ) {
    //   throw new BadRequestException('Degree Certificate not required for this role.')
    // }
    // if (role === UserRole.CLIENT && currentPracticeLicenseUrl) {
    //   throw new BadRequestException('Current Practice License not required for this role.')
    // }

  //   if (role === UserRole.CLIENT) {
  //     const requiredFields = {
  //       firstName: 'First Name',
  //       lastName: 'Last Name',
  //       email: 'Email',
  //       password: 'Password',
  //       phoneNumber: 'Phone Number',
  //       gender:'Gender',
  //       maritalStatus: 'Marital Status',
  //       dateOfBirth: 'Date Of Birth',
  //       countryOfResidence: 'Country Of Residence',
  //       countryOfOrigin: 'Country Of Origin',
  //       stateOfResidence: 'State Of Residence',
  //       stateOfOrigin: 'State Of Origin',
  //     };
    
  //     for (const [key, message] of Object.entries(requiredFields)) {
  //       if (!createUserDto[key] || (Array.isArray(createUserDto[key]) && createUserDto[key].length === 0)) {
  //         throw new BadRequestException(`Client must provide ${message}.`);
  //       }
  //     }
  //   }

  //   if (role === UserRole.MEDICAL_PRACTITIONER) {
  //     const prohibitedFields = {
  //       ward: 'Ward',
  //       localGovernmentArea: 'Local Government Area',
  //       hospitalName: 'Hospital Name',
  //       officerInCharge: 'Officer In Charge',
  //     };
    
  //     for (const [key, message] of Object.entries(prohibitedFields)) {
  //       if (createUserDto[key]) {
  //         throw new BadRequestException(`${message} not required for this role.`);
  //       }
  //     }
  //   }

  //   if (role === UserRole.MEDICAL_PRACTITIONER) {
  //     const requiredFields = {
  //       firstName: 'First Name',
  //       lastName: 'Last Name',
  //       email: 'Email',
  //       password: 'Password',
  //       phoneNumber: 'Phone Number',
  //       specialty: 'Area of Specialty',
  //       gender:'Gender',
  //       maritalStatus: 'Marital Status',
  //       dateOfBirth: 'Date Of Birth',
  //       countryOfResidence: 'Country Of Residence',
  //       countryOfOrigin: 'Country Of Origin',
  //       stateOfResidence: 'State Of Residence',
  //       stateOfOrigin: 'State Of Origin',
  //       languageProficiency: 'Language Proficiency',
  //       policyAgreement: 'Policy Agreement',
  //       bankDetails: 'Bank Details',
  //     };
    
  //     for (const [key, message] of Object.entries(requiredFields)) {
  //       if (!createUserDto[key] || (Array.isArray(createUserDto[key]) && createUserDto[key].length === 0)) {
  //         throw new BadRequestException(`Medical Practitioner must provide ${message}.`);
  //       }
  //     }

  //         if (!degreeCertificateUrl) {
  //       throw new BadRequestException('Medical Practitioner must provide Degree Certificate.');
  //     }
      
  //     if (!currentPracticeLicenseUrl) {
  //       throw new BadRequestException('Medical Practitioner must provide Current Practice License.');
  //     }
  //   }
  
  //   if (role === UserRole.EMERGENCY_SERVICES) {
  //     const prohibitedFields = {
  //       firstName: 'First Name',
  //       lastName: 'Last Name',
  //       email: 'Email',
  //       password: 'Password',
  //       specialty: 'Area of Specialty',
  //       languageProficiency: 'Language Proficiency',
  //       gender:'Gender',
  //       maritalStatus: 'Marital Status',
  //       dateOfBirth: 'Date Of Birth',
  //     };
    
  //     for (const [key, message] of Object.entries(prohibitedFields)) {
  //       if (createUserDto[key]) {
  //         throw new BadRequestException(`${message} not required for this role.`);
  //       }
  //     }
  //   }
  //   if (role === UserRole.EMERGENCY_SERVICES && degreeCertificateUrl ) {
  //     throw new BadRequestException('Degree Certificate not required for this role.')
  //   }
  //   if (role === UserRole.EMERGENCY_SERVICES && currentPracticeLicenseUrl) {
  //     throw new BadRequestException('Current Practice License not required for this role.')
  //   }

  //   if (role === UserRole.EMERGENCY_SERVICES) {
  //     if (!createUserDto.hospitalName|| !createUserDto.officerInCharge || !createUserDto.bankDetails) {
  //       throw new BadRequestException(
  //         'Hospital Name and Officer In Charge and Bank Details be must provide.',
  //       );
  //     }

  //     if (!createUserDto.ward) {
  //       throw new BadRequestException('Emergency Services must provide ward.');
  //     }

  //     if (!createUserDto.localGovernmentArea) {
  //       throw new BadRequestException('Emergency Services must provide local goverment area.');
  //     }

  //     if (!createUserDto.stateOfResidence) {
  //       throw new BadRequestException('Emergency Services must provide State.');
  //     }
  //   }
  
  //   const hashedPassword = await bcrypt.hash(password, 10);
  
  //   const user = new this.userModel({
  //     ...createUserDto,
  //     password: hashedPassword,
  //     profileImage: profileImageUrl,
  //     degreeCertificate: degreeCertificateUrl,
  //     currentPracticeLicense: currentPracticeLicenseUrl,
  //     policyAgreement: role === UserRole.MEDICAL_PRACTITIONER ? true : createUserDto.policyAgreement,
  //   });

  //   const createdUser = await user.save();

  //   const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //   const otpToken = this.jwtService.sign(
  //     { userId: createdUser._id, otp },
  //     {
  //       secret: this.configService.get<string>('JWT_SECRET'),
  //       expiresIn: '30m',
  //     }
  //   );
  //   const frontendUrl = this.configService.get<string>('FRONTEND_URL');
  //   const otpLink = `${frontendUrl}/api/signup/verify-email?token=${encodeURIComponent(otpToken)}&otp=${encodeURIComponent(otp)}`;
  
  //   await this.emailService.sendConfirmationEmail(createdUser.email, createUserDto.firstName, otp, otpLink);
  
  //   return {
  //     message: 'Account created successfully. Please verify your email.',
  //     token: otpToken,
  //     otp,
  //   };
  // }
  
  

  async createUser(
    files: {
      profileImage?: Express.Multer.File[];
      degreeCertificate?: Express.Multer.File[];
      currentPracticeLicense?: Express.Multer.File[];
    },
    createUserDto: CreateUserDto
  ): Promise<{ message: string; token: string; otp: string }> {
    
    if (!files.profileImage || files.profileImage.length === 0) {
      throw new BadRequestException('Profile Image is required.');
    }
  
    // Upload files concurrently for better performance
    const [profileImageUpload, degreeUpload, licenseUpload] = await Promise.all([
      this.cloudinaryService.uploadFile(files.profileImage?.[0]),
      files.degreeCertificate?.[0] ? this.cloudinaryService.uploadFile(files.degreeCertificate[0]) : null,
      files.currentPracticeLicense?.[0] ? this.cloudinaryService.uploadFile(files.currentPracticeLicense[0]) : null,
    ]);
  
    const profileImageUrl = profileImageUpload.secure_url;
    const degreeCertificateUrl = degreeUpload?.secure_url || '';
    const currentPracticeLicenseUrl = licenseUpload?.secure_url || '';
  
    const { email, role, password, phoneNumber } = createUserDto;
  
    const existingUser = await this.userModel.findOne({ role, email: email.toLowerCase() }).exec();
    if (existingUser) {
      throw new ConflictException('User with the same email already exists');
    }

    const existingUserPhoneNumber = await this.userModel.findOne({ role, phoneNumber: phoneNumber.trim() }).exec();
    if (existingUserPhoneNumber) {
      throw new ConflictException('User with the same Phone Number already exists');
    }
  
    if (role === UserRole.CLIENT && degreeCertificateUrl ) {
      throw new BadRequestException('Degree Certificate not required for this role.')
    }
    if (role === UserRole.CLIENT && currentPracticeLicenseUrl) {
      throw new BadRequestException('Current Practice License not required for this role.')
    }
    // Role-based validation
    const validationRules = {
      [UserRole.CLIENT]: {
        prohibitedFields: ['bankDetails', 'degreeCertificateUrl', 'currentPracticeLicenseUrl', 'specialty', 'ward', 'localGovernmentArea', 'hospitalName', 'officerInCharge', 'languageProficiency'],
        requiredFields: ['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'gender', 'maritalStatus', 'dateOfBirth', 'countryOfResidence', 'countryOfOrigin', 'stateOfResidence', 'stateOfOrigin'],
      },
      [UserRole.MEDICAL_PRACTITIONER]: {
        prohibitedFields: ['ward', 'localGovernmentArea', 'hospitalName', 'officerInCharge'],
        requiredFields: ['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'specialty', 'gender', 'maritalStatus', 'dateOfBirth', 'countryOfResidence', 'countryOfOrigin', 'stateOfResidence', 'stateOfOrigin', 'languageProficiency', 'bankDetails'],
        mustHaveFiles: { degreeCertificateUrl, currentPracticeLicenseUrl },
      },
      [UserRole.EMERGENCY_SERVICES]: {
        prohibitedFields: ['firstName', 'lastName', 'email', 'password', 'specialty', 'languageProficiency', 'gender', 'maritalStatus', 'dateOfBirth'],
        requiredFields: ['hospitalName', 'officerInCharge', 'bankDetails', 'ward', 'localGovernmentArea', 'stateOfResidence'],
      },
    };
  
    const rules = validationRules[role];
    if (rules) {
      // Check prohibited fields
      for (const field of rules.prohibitedFields || []) {
        if (createUserDto[field]) {
          throw new BadRequestException(`${field.replace(/([A-Z])/g, ' $1')} is not required for this role.`);
        }
      }
  
      // Check required fields
      for (const field of rules.requiredFields || []) {
        if (!createUserDto[field]) {
          throw new BadRequestException(`${field.replace(/([A-Z])/g, ' $1')} is required.`);
        }
      }
  
      // Check required files for certain roles
      if (rules.mustHaveFiles) {
        for (const [key, value] of Object.entries(rules.mustHaveFiles)) {
          if (!value) {
            throw new BadRequestException(`${key.replace(/([A-Z])/g, ' $1')} is required.`);
          }
        }
      }
    }

    if (typeof createUserDto.bankDetails === 'string') {
      try {
        createUserDto.bankDetails = JSON.parse(createUserDto.bankDetails);
      } catch (error) {
        throw new BadRequestException('Invalid bank details format');
      }
    }

    // Ensure it's an array
    if (!Array.isArray(createUserDto.bankDetails)) {
      throw new BadRequestException('Bank details should be an array');
    }

    for (const bankDetail of createUserDto.bankDetails) {
      if (
        !bankDetail.bankName ||
        !bankDetail.accountName ||
        !bankDetail.accountNumber
      ) {
        throw new BadRequestException(
          'Each bank detail must have bankName, accountName, and accountNumber'
        );
      }
      // Optional: Ensure accountNumber is a valid number (assuming it's numeric)
      if (!/^\d+$/.test(bankDetail.accountNumber)) {
        throw new BadRequestException('Account number must be numeric');
      }
    }
  
  
    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Create user object
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      profileImage: profileImageUrl,
      degreeCertificate: degreeCertificateUrl,
      currentPracticeLicense: currentPracticeLicenseUrl,
      policyAgreement: role === UserRole.MEDICAL_PRACTITIONER ? true : createUserDto.policyAgreement,
    });
  
    const createdUser = await user.save();
    await this.walletService.createWallet(createdUser._id);

  
    // Generate OTP and sign JWT token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpToken = this.jwtService.sign(
      { userId: createdUser._id, otp },
      { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '30m' }
    );
  
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const otpLink = `${frontendUrl}/api/signup/verify-email?token=${encodeURIComponent(otpToken)}&otp=${encodeURIComponent(otp)}`;
  
    // Send email verification
    await this.emailService.sendConfirmationEmail(createdUser.email, createUserDto.firstName, otp, otpLink);
  
    return {
      message: 'Account created successfully. Please verify your email.',
      token: otpToken,
      otp,
    };
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



  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userModel
      .findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
      .exec();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
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


 async requestPasswordReset(
    email: string,
  ): Promise<{ message: string; otp: string; token: string }> {
    // Find the user by email
    const user = await this.userModel
      .findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create an OTP token
    const otpToken = this.jwtService.sign(
      { userId: user._id, otp },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '30m',
      },
    );
    // Generate the OTP reset link
    const otpLink = `${process.env.FRONTEND_URL}/users/reset-password?token=${encodeURIComponent(otpToken)}&otp=${encodeURIComponent(otp)}`;

    // Send the OTP via email
    await this.emailService.SendResetPassword(user.email, otp, otpLink);
    return {
      message: 'Password reset OTP has been sent successfully',
      otp,
      token: otpToken,
    };
  }

  async verifyResetPasswordOtp(
    token: string,
    otp: string,
  ): Promise<{ message: string; token: string }> {
    if (!token || !otp) {
      throw new BadRequestException('Token and OTP are required');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const decoded = this.jwtService.verify(token, { secret });

      if (otp !== decoded.otp) {
        throw new BadRequestException('Invalid OTP');
      }


       const user = await this.userModel.findById(decoded.userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

      return {
        message: 'Password reset OTP has been verified successfully.',
        token,
      };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }


  async resetPassword(
    resetToken: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    if (!resetToken) {
      throw new BadRequestException('Invalid or missing reset token.');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const decoded = this.jwtService.verify(resetToken, { secret });

      const user = await this.userModel.findById(decoded.userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.password = await bcrypt.hash(password, 10);
      await user.save();

      return { message: 'Password has been reset successfully.' };
    } catch (error) {
      this.logger.error('Error resetting password:', error);
      throw new UnauthorizedException('Invalid or expired reset token.');
    }
  }


  async getUserById(userId: string): Promise<User> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
  
    const user = await this.userModel.findById(userId).select('-password').exec();
  
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
  
  

}
