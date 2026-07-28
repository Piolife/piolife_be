/**
 * sessions.controller.ts — PATCHED
 *
 * FIXES vs original:
 * 1. GET practitioners now accepts query params (frontend calls GET not POST)
 * 2. POST practitioners kept for backwards compat
 * 3. GET prescriptions/user/:userId — prescription schema uses `complain` not `complaint`
 *    and `advice` not `prognosis` — frontend field names aligned in DTO patch
 * 4. Duplicate route GET history/:userId & GET history/:practitionerId (same path!) — FIXED
 *    by renaming practitioner history to GET history/practitioner/:practitionerId
 * 5. createPrescription requires JWT but request has no @UseGuards — added
 */
import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Req,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  // ── Sessions ──────────────────────────────────────────────────────────────

  @Get('pending/:practitionerId')
  async getPendingSessions(@Param('practitionerId') practitionerId: string) {
    return this.service.getPendingSessionsForPractitioner(practitionerId);
  }

  @Get('with-review/:sessionId')
  async getSessionWithReview(@Param('sessionId') sessionId: string) {
    if (!sessionId) throw new BadRequestException('sessionId is required');
    return this.service.getSessionWithReview(sessionId);
  }

  @Get('history/:userId')
  async getUserSessionHistory(@Param('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.service.getSessionsForUser(userId);
  }

  // FIX: was GET history/:practitionerId — clashes with GET history/:userId (same path)
  @Get('history/practitioner/:practitionerId')
  async getPractitionerSessionHistory(
    @Param('practitionerId') practitionerId: string,
  ) {
    if (!practitionerId)
      throw new BadRequestException('practitionerId is required');
    return this.service.getSessionsForPractitionerId(practitionerId);
  }

  // ── Practitioners matching ─────────────────────────────────────────────────

  // FIX: frontend calls GET /sessions/practitioners?issueIds=...&language=...
  // Original was POST only — added GET version
  @Get('practitioners')
  @ApiOperation({
    summary: 'Find matching practitioners (GET version for frontend)',
  })
  @ApiQuery({ name: 'issueIds', required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async getMatchingPractitionersQuery(
    @Query('issueIds') issueIds?: string,
    @Query('language') language?: string,
    @Query('userId') userId?: string,
  ): Promise<any> {
    const specialty = issueIds ? issueIds.split(',').filter(Boolean) : [];
    const languageProficiency = language ? [language] : [];
    const dto: BookSessionDto = {
      specialty,
      languageProficiency,
      userId: userId ?? '',
    };
    return this.service.findMatchingPractitioners(dto);
  }

  @Post('practitioners')
  async getMatchingPractitioners(@Body() dto: BookSessionDto): Promise<any> {
    return this.service.findMatchingPractitioners(dto);
  }

  @Post('book-session')
  async bookSession(@Body() dto: BookSessionDto) {
    return this.service.bookSessionWithAnyPractitioner(dto);
  }

  @Post('review')
  async submitReview(@Body() dto: CreateReviewDto) {
    if (!dto.practitionerId) {
      throw new BadRequestException('practitionerId is required');
    }
    return this.service.submitReview(dto, dto.practitionerId);
  }

  // ── Consultations ─────────────────────────────────────────────────────────

  @Post('consultations')
  @UseGuards(AuthGuard('jwt'))
  async createConsultation(
    @Body() dto: CreateConsultationDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.service.create(dto, userId);
  }

  @Get('consultations/user/:userId')
  async getConsultationsByUser(@Param('userId') userId: string): Promise<any> {
    if (!userId) throw new BadRequestException('userId is required');
    return this.service.getConsultationsByUser(userId);
  }

  @Get('consultations/practitioner/:practitionerId')
  async getConsultationsByPractitioner(
    @Param('practitionerId') practitionerId: string,
  ): Promise<any> {
    if (!practitionerId)
      throw new BadRequestException('practitionerId is required');
    return this.service.getConsultationsByPractitioner(practitionerId);
  }

  @Patch('consultations/:id/awaiting-prescription')
  @UseGuards(AuthGuard('jwt'))
  async setAwaitingPrescription(@Param('id') id: string) {
    if (!id) throw new BadRequestException('consultationId is required');
    try {
      return await this.service.markConsultationAwaitingPrescription(id);
    } catch {
      throw new NotFoundException('Consultation not found');
    }
  }

  @Post('consultations/:id/notify-doctor')
  @UseGuards(AuthGuard('jwt'))
  async notifyDoctorForPrescription(@Param('id') id: string) {
    if (!id) throw new BadRequestException('consultationId is required');
    await this.service.notifyDoctorForPrescription(id);
    return { message: 'Doctor notified' };
  }

  // ── Prescriptions ─────────────────────────────────────────────────────────

  // FIX: original had no @UseGuards here — anyone could write a prescription
  @Post('prescriptions')
  @UseGuards(AuthGuard('jwt'))
  async createPrescription(
    @Body() dto: CreatePrescriptionDto,
    @Req() req: RequestWithUser,
  ) {
    const practitionerId = req.user.userId;
    if ((!dto.userId && !dto.patientId) || !practitionerId) {
      throw new BadRequestException('userId and practitionerId are required');
    }
    // Ensure practitionerId in body matches authenticated user
    dto.practitionerId = practitionerId;
    return this.service.createPrescription(dto);
  }

  @Get('prescriptions/consultation/:consultationId')
  async getPrescriptionByConsultation(
    @Param('consultationId') consultationId: string,
  ): Promise<any> {
    if (!consultationId)
      throw new BadRequestException('consultationId is required');
    return this.service.getPrescriptionByConsultationId(consultationId);
  }

  @Get('prescriptions/user/:userId')
  async getPrescriptionsByUser(@Param('userId') userId: string): Promise<any> {
    if (!userId) throw new BadRequestException('userId is required');
    return this.service.getPrescriptionsByUser(userId);
  }

  @Get('prescriptions/practitioner/:practitionerId')
  async getPrescriptionsByPractitioner(
    @Param('practitionerId') practitionerId: string,
  ): Promise<any> {
    if (!practitionerId)
      throw new BadRequestException('practitionerId is required');
    return this.service.getPrescriptionsByPractitioner(practitionerId);
  }
}
