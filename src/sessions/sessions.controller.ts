/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import {
  BookSessionDto,
  CreateConsultationDto,
  CreatePrescriptionDto,
  CreateReviewDto,
} from './dto/create-session.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}
@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get('pending/:practitionerId')
  @ApiOperation({ summary: 'Get pending sessions for a practitioner' })
  @ApiParam({ name: 'practitionerId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Pending sessions retrieved successfully',
  })
  async getPendingSessions(@Param('practitionerId') practitionerId: string) {
    return this.service.getPendingSessionsForPractitioner(practitionerId);
  }

  @Get('with-review/:sessionId')
  @ApiOperation({ summary: 'Get a session along with its review' })
  @ApiParam({ name: 'sessionId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Session with review fetched successfully',
  })
  async getSessionWithReview(@Param('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId is required');
    }

    return this.service.getSessionWithReview(sessionId);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get all session history for a user' })
  @ApiParam({ name: 'userId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'User session history retrieved successfully',
  })
  async getUserSessionHistory(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.service.getSessionsForUser(userId);
  }

  @Get('history/:practitionerId')
  @ApiOperation({
    summary: 'Get all session history for a medical practitioner',
  })
  @ApiParam({ name: 'practitionerId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'User session history retrieved successfully',
  })
  async getPractitionerIdSessionHistory(
    @Param('practitionerId') practitionerId: string,
  ) {
    if (!practitionerId) {
      throw new BadRequestException('userId is required');
    }
    return this.service.getSessionsForPractitionerId(practitionerId);
  }

  @Post('practitioners')
  @ApiOperation({
    summary: 'Find matching medical practitioners based on filters',
  })
  @ApiBody({ type: BookSessionDto })
  @ApiResponse({ status: 200, description: 'Matching practitioners returned' })
  async getMatchingPractitioners(@Body() dto: BookSessionDto) {
    return this.service.findMatchingPractitioners(dto);
  }

  @Post('book-session')
  @ApiOperation({ summary: 'Book a session with any available practitioner' })
  @ApiBody({ type: BookSessionDto })
  @ApiResponse({ status: 201, description: 'Session booked successfully' })
  async bookSession(@Body() dto: BookSessionDto) {
    return this.service.bookSessionWithAnyPractitioner(dto);
  }

  @Post('review')
  @ApiOperation({ summary: 'Submit a review for a session' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  async submitReview(@Body() dto: CreateReviewDto) {
    const { practitionerId } = dto;
    if (!practitionerId) {
      throw new BadRequestException('practitionerId is required');
    }
    return this.service.submitReview(dto, practitionerId);
  }

  @Post('consultations')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Create a new consultation between user and practitioner',
  })
  @ApiBody({ type: CreateConsultationDto })
  @ApiResponse({
    status: 201,
    description: 'Consultation created successfully',
  })
  async createConsultation(
    @Body() dto: CreateConsultationDto,
    @Req() req: RequestWithUser,
  ) {
    const { practitionerId } = dto;
    const userId = req.user.userId;
    if (!userId || !practitionerId) {
      throw new BadRequestException('userId and practitionerId are required');
    }

    return this.service.create(dto, userId);
  }

  @Get('consultations/user/:userId')
  @ApiOperation({ summary: 'Get all consultations for a user' })
  @ApiParam({ name: 'userId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Consultations for user retrieved successfully',
  })
  async getConsultationsByUser(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.service.getConsultationsByUser(userId);
  }

  @Get('consultations/practitioner/:practitionerId')
  @ApiOperation({ summary: 'Get all consultations for a practitioner' })
  @ApiParam({ name: 'practitionerId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Consultations for practitioner retrieved successfully',
  })
  async getConsultationsByPractitioner(
    @Param('practitionerId') practitionerId: string,
  ) {
    if (!practitionerId) {
      throw new BadRequestException('practitionerId is required');
    }
    return this.service.getConsultationsByPractitioner(practitionerId);
  }

  @Post('prescriptions')
  @ApiOperation({ summary: 'Create a new prescription' })
  @ApiBody({ type: CreatePrescriptionDto })
  @ApiResponse({
    status: 201,
    description: 'Prescription created successfully',
  })
  async createPrescription(
    @Body() dto: CreatePrescriptionDto,
    @Req() req: RequestWithUser,
  ) {
    const { userId } = dto;
    const practitionerId = req.user.userId;
    if (!userId || !practitionerId) {
      throw new BadRequestException('userId and practitionerId are required');
    }

    return this.service.createPrescription(dto);
  }

  @Get('prescriptions/user/:userId')
  @ApiOperation({ summary: 'Get all prescriptions for a user' })
  @ApiParam({ name: 'userId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Prescriptions for user retrieved successfully',
  })
  async getPrescriptionsByUser(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.service.getPrescriptionsByUser(userId);
  }

  @Get('prescriptions/practitioner/:practitionerId')
  @ApiOperation({ summary: 'Get all prescriptions for a practitioner' })
  @ApiParam({ name: 'practitionerId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Prescriptions for practitioner retrieved successfully',
  })
  async getPrescriptionsByPractitioner(
    @Param('practitionerId') practitionerId: string,
  ) {
    if (!practitionerId) {
      throw new BadRequestException('practitionerId is required');
    }
    return this.service.getPrescriptionsByPractitioner(practitionerId);
  }
}
