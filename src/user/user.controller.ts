import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query, BadRequestException, UnauthorizedException, UsePipes, ValidationPipe, UploadedFile, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, LoginDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { FileFieldsInterceptor, } from '@nestjs/platform-express';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@ApiTags(' User Auth')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
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
        role: { type: 'string', enum: ['client', 'medical_practitioner', 'emergency_services', 'real_estate_services', 'insurance_services'] },
        gender: { type: 'string', nullable: true },
        dateOfBirth: { type: 'string', format: 'date', nullable: true },
        maritalStatus: { type: 'string', nullable: true },
        countryOrigin: { type: 'string', nullable: true },
        phoneNumber: { type: 'string', nullable: true },
        stateOfOrigin: { type: 'string', nullable: true },
        countryOfResidence: { type: 'string', nullable: true },
        stateOfResidence: { type: 'string', nullable: true },
        profileImage: { type: 'string', format: 'binary', nullable: true }, 
        degreeCertificate: { type: 'string', format: 'binary', nullable: true },
        currentPracticeLicense: { type: 'string', format: 'binary', nullable: true },
        bankDetails: {
          type: 'object',
          properties: {
            bankName: { type: 'string' },
            accountName: { type: 'string' },
            accountNumber: { type: 'string' },
          },
          nullable: true,
        },
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
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFiles() files: { 
      profileImage?: Express.Multer.File[]; 
      degreeCertificate?: Express.Multer.File[]; 
      currentPracticeLicense?: Express.Multer.File[];
    }
  ): Promise<{ message: string; token: string; otp: string }> {

    
    const validatedDto = plainToInstance(CreateUserDto, createUserDto);    
    const errors = validateSync(validatedDto, { whitelist: true, forbidNonWhitelisted: true });
  
    if (errors.length > 0) {
      const formattedErrors = errors.map(error => ({
        property: error.property,
        constraints: error.constraints,
      }));
  
      throw new BadRequestException({
        message: 'Invalid input fields',
        errors: formattedErrors,
      });
    }
  
    return await this.userService.createUser(files, createUserDto);
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
      throw new UnauthorizedException(`${email} has no account as a ${role}, Please signup as a ${role}`);
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

      throw new UnauthorizedException('Account not Verified. A new verification code has been sent to your email.');
    }

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
        dateOfBirth: user.dateOfBirth,
        email: user.email,
        profileImageUrl: user.profileImage,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@example.com' },
      },
    },
  })
  async requestPasswordReset(@Body('email') email: string) {
    return this.userService.requestPasswordReset(email);
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
}
