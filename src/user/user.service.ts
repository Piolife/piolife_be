import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly cloudinaryService: CloudinaryService,
  private emailService: EmailService,
  ) {}


  async createUser(
    files: { 
      profileImage?: Express.Multer.File[]; 
      degreeCertificate?: Express.Multer.File[]; 
      currentPracticeLicense?: Express.Multer.File[];
    }, 
    createUserDto: CreateUserDto
  ): Promise<{ message: string; token: string; otp: string }> {
  
    let profileImageUrl = '';
    let degreeCertificateUrl = '';
    let currentPracticeLicenseUrl = '';
  
    // Upload and assign each file separately
    if (files.profileImage && files.profileImage.length > 0) {
      const uploadedProfile = await this.cloudinaryService.uploadFile(files.profileImage[0]);
      profileImageUrl = uploadedProfile.secure_url;
    }
  
    if (files.degreeCertificate && files.degreeCertificate.length > 0) {
      const uploadedDegree = await this.cloudinaryService.uploadFile(files.degreeCertificate[0]);
      degreeCertificateUrl = uploadedDegree.secure_url;
    }
  
    if (files.currentPracticeLicense && files.currentPracticeLicense.length > 0) {
      const uploadedLicense = await this.cloudinaryService.uploadFile(files.currentPracticeLicense[0]);
      currentPracticeLicenseUrl = uploadedLicense.secure_url;
    }
  
    const { email, role, password} = createUserDto;
  
    const existingUser = await this.userModel.findOne({ role, email: email.toLowerCase() }).exec();
    if (existingUser) {
      throw new ConflictException('User with the same email already exists');
    }
  
    if (role === UserRole.MEDICAL_PRACTITIONER) {
      if (!degreeCertificateUrl || !currentPracticeLicenseUrl || !createUserDto.bankDetails) {
        throw new BadRequestException(
          'Medical Practitioner must provide Degree Certificate, Current Practice License, and Bank Details.',
        );
      }
    }

    if (role === UserRole.EMERGENCY_SERVICES) {
      if (!createUserDto.hospitalName|| !createUserDto.officerInCharge || !createUserDto.bankDetails) {
        throw new BadRequestException(
          'Hospital Name and Officer In Charge and Bank Details be must provide.',
        );
      }
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      profileImage: profileImageUrl,
      degreeCertificate: degreeCertificateUrl,
      currentPracticeLicense: currentPracticeLicenseUrl,
    });

    const createdUser = await user.save();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpToken = this.jwtService.sign(
      { userId: createdUser._id, otp },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '30m',
      }
    );

  
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const otpLink = `${frontendUrl}/api/signup/verify-email?token=${encodeURIComponent(otpToken)}&otp=${encodeURIComponent(otp)}`;
  
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

}
