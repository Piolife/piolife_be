import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiConsumes, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query, BadRequestException, UnauthorizedException, UsePipes, ValidationPipe, UploadedFile, UseInterceptors, UploadedFiles, Param, UseGuards, HttpCode, HttpStatus, ForbiddenException, HttpException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, LoginDto, LogoutDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { FileFieldsInterceptor, } from '@nestjs/platform-express';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { User } from './Schema/user.schema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { EmailService } from 'src/services/email/email.sevice';
import { PresenceGateway } from './presence.gateway';

@ApiTags(' User Auth')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  private emailService: EmailService,
  private readonly presenceGateway: PresenceGateway,


  ) {}

  
  // @Get('practitioners')
  // getPractitioners() {
  //   return this.userService.findAllMedicalPractitioners();
  // }

  @Get('medical-practitioners')
  async getMedicalPractitioners(
    @Query('languages') languages?: string | string[],
  ): Promise<User[]> {
    const languageList = Array.isArray(languages)
      ? languages
      : languages
      ? [languages]
      : [];

    return this.userService.findAllMedicalPractitioners(languageList);
  }

  @Post('create')
@ApiOperation({ summary: 'Create a new user' })
@ApiResponse({ status: 201, description: 'User created successfully' })
@ApiResponse({ status: 400, description: 'Failed to create user' })
@ApiConsumes('multipart/form-data') 
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      otherName: { type: 'string', nullable: true },
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
      role: { 
        type: 'string', 
        enum: [
          'client', 
          'medical_practitioner', 
          'emergency_services', 
          'real_estate_services', 
          'insurance_services'
        ] 
      },
      gender: { type: 'string', nullable: true },
      dateOfBirth: { type: 'string', format: 'date', nullable: true },
      maritalStatus: { type: 'string', nullable: true },
      countryOfOrigin: { type: 'string', nullable: true },
      phoneNumber: { type: 'string', nullable: true },
      stateOfOrigin: { type: 'string', nullable: true },
      countryOfResidence: { type: 'string', nullable: true },
      stateOfResidence: { type: 'string', nullable: true },
      profileImage: { type: 'string', format: 'binary', nullable: true }, 
      degreeCertificate: { type: 'string', format: 'binary', nullable: true },
      currentPracticeLicense: { type: 'string', format: 'binary', nullable: true },
      bankDetails: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            bankName: { type: 'string' },
            accountName: { type: 'string' },
            accountNumber: { type: 'string' },
          },
        },
        nullable: true,
      },
      languageProficiency: {
        type: 'array',
        items: { type: 'string' },
        nullable: true,
        description: 'List of languages the user is proficient in',
      },
      specialty: { 
        type: 'string', 
        nullable: true, 
        description: 'Specialization of the user (required for medical practitioners)' 
      }
    },
    required: ['firstName', 'lastName', 'email', 'password', 'role'],
  },
})
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'profileImage', maxCount: 1 },
    { name: 'degreeCertificate', maxCount: 1 },
    { name: 'currentPracticeLicense', maxCount: 1 },
  ]),
)


@Post('create')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        message: 'Account created successfully. Please verify your email.',
        token: 'your-jwt-token',
        otp: '123456',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request or validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiQuery({ name: 'token', required: false, description: 'Verification token' })
  @ApiQuery({ name: 'otp', required: false, description: 'One-Time Password' })
  async verifyEmail(@Query('token') token?: string, @Query('otp') otp?: string): Promise<any> {
    return this.userService.verifyEmail(token, otp);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or unverified account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
        role: { type: 'string', enum: ['client', 'medical_practitioner'] },       
      },
    }
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async loginUser(@Body() loginDto: LoginDto & { role: string }) {
    const email = loginDto.email.trim();
    const password = loginDto.password;
    const role = loginDto.role;
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('No account found for this user, please signup');
    }

    if (user.role !== role) {
      throw new UnauthorizedException(`Invalid email or password for selected role`);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpToken = this.jwtService.sign(
        { userId: user._id, otp },
        { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '30m' },
      );
    
      await this.emailService.sendConfirmationEmail(user.email, user.firstName, otp, otpToken);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Account not verified. A new verification code has been sent to your email.',
          otpToken,
        },
        HttpStatus.FORBIDDEN,
      );
      
    }

      // ✅ Set user online and notify others
      await this.userService.setUserOnlineStatus(user._id, true);
      this.presenceGateway.server.emit('userStatusChanged', {
        userId: user._id,
        isOnline: true,
      });
    
    const token = this.jwtService.sign(
      { email: user.email, role: user.role },
      { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '24h' },
    );

    return {
      message: 'Login successful',
      user: {
        id: user._id,
        token,
        isVerified: user.isVerified,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        otherName: user.otherName,
        username: user.username,
        phoneNumber: user.phoneNumber,
        alternatePhoneNumber: user.alternatePhoneNumber,
        maritalStatus: user.maritalStatus,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        countryOfOrigin: user.countryOfOrigin,
        stateOfOrigin: user.stateOfOrigin,
        countryOfResidence: user.countryOfResidence,
        stateOfResidence: user.stateOfResidence,
        profilePicture: user.profilePicture,
        role: user.role,
        status: user.status,
        bankDetails: user.bankDetails,
        languageProficiency: user.languageProficiency,
        specialty: user.specialty,
        ward: user.ward,
        localGovernmentArea: user.localGovernmentArea,
        hospitalName: user.hospitalName,
        officerInCharge: user.officerInCharge,
        twoFactorEnabled: user.twoFactorEnabled,
        degreeCertificate: user.degreeCertificate,
        currentPracticeLicense: user.currentPracticeLicense,
        policyAgreement: user.policyAgreement,
        referralCode: user.referralCode,
        myReferralCode: user.myReferralCode,
        referralCount: user.referralCount,
        isOnline: true,
        phamacyName: user.pharmacyName,
        medicalLabName: user.medicalLabName,
        

      },
    };
    
  }


 
  
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @ApiResponse({ status: 400, description: 'Invalid user ID' })
  @Post('logout')
  async logout(@Body() body: LogoutDto) {
    return this.userService.logout(body.userId);
  }
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@example.com' },
        role: { type: 'string', example: 'client' },
      },
    },
  })
@HttpCode(HttpStatus.OK)
async requestReset(@Body() body: { email: string; role: 'client' | 'medical_practitioner' }) {
  return this.userService.requestPasswordReset(body.email, body.role);
}


  @Post('verify-reset-otp')
  @ApiOperation({ summary: 'Verify password reset OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'jwt-token-here' },
        otp: { type: 'string', example: '123456' },
      },
    },
  })
  async verifyResetOtp(@Body('token') token: string, @Body('otp') otp: string) {
    return this.userService.verifyResetPasswordOtp(token, otp);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'jwt-token-here' },
        password: { type: 'string', example: 'NewStrongPassword123!' },
        confirmPassword: { type: 'string', example: 'NewStrongPassword123!' },
      },
    },
  })
  async resetPassword(
    @Body('token') resetToken: string,
    @Body('password') password: string,
    @Body('confirmPassword') confirmPassword: string,
  ) {
    return this.userService.resetPassword(resetToken, password, confirmPassword);
  }

  // @UseGuards(JwtAuthGuard)
  @Get(':id')
  // @ApiBearerAuth() 
  @ApiOperation({ summary: 'Get a user by ID' }) 
  @ApiParam({ name: 'id', required: true, description: 'User ID' }) 
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: User }) 
  @ApiResponse({ status: 400, description: 'Invalid User ID' }) 
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' }) 
  async getUser(@Param('id') id: string): Promise<User> {
    return this.userService.getUserById(id);
  }



}
