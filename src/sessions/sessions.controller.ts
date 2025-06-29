import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { BookSessionDto, CreateReviewDto } from './dto/create-session.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get('pending/:practitionerId')
  @ApiOperation({ summary: 'Get pending sessions for a practitioner' })
  @ApiParam({ name: 'practitionerId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Pending sessions retrieved successfully' })
  async getPendingSessions(@Param('practitionerId') practitionerId: string) {
    return this.service.getPendingSessionsForPractitioner(practitionerId);
  }

  @Get('with-review/:sessionId')
@ApiOperation({ summary: 'Get a session along with its review' })
@ApiParam({ name: 'sessionId', required: true })
@ApiResponse({ status: 200, description: 'Session with review fetched successfully' })
async getSessionWithReview(@Param('sessionId') sessionId: string) {
  if (!sessionId) {
    throw new BadRequestException('sessionId is required');
  }

  return this.service.getSessionWithReview(sessionId);
}


  @Get('history/:userId')
  @ApiOperation({ summary: 'Get all session history for a user' })
  @ApiParam({ name: 'userId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'User session history retrieved successfully' })
  async getUserSessionHistory(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.service.getSessionsForUser(userId);
  }

  @Get('history/:practitionerId')
  @ApiOperation({ summary: 'Get all session history for a medical practitioner' })
  @ApiParam({ name: 'practitionerId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'User session history retrieved successfully' })
  async getPractitionerIdSessionHistory(@Param('practitionerId') practitionerId: string) {
    if (!practitionerId) {
      throw new BadRequestException('userId is required');
    }
    return this.service.getSessionsForPractitionerId(practitionerId);
  }

  @Post('practitioners')
  @ApiOperation({ summary: 'Find matching medical practitioners based on filters' })
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
}
