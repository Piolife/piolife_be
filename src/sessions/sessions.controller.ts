import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { BookSessionDto, CreateReviewDto, } from './dto/create-session.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}
  @Get('pending/:practitionerId')
  async getPendingSessions(
    @Param('practitionerId') practitionerId: string
  ) {
    return this.service.getPendingSessionsForPractitioner(practitionerId);
  }

  @Post('practitioners')
  async getMatchingPractitioners(@Body() dto: BookSessionDto) {
    return this.service.findMatchingPractitioners(dto);
  }
  @Post('book-session')
async bookSession(@Body() dto: BookSessionDto) {
  return this.service.bookSessionWithAnyPractitioner(dto);
}

@Post('review')
async submitReview(
  @Body() dto: CreateReviewDto
) {
  const { practitionerId } = dto;

  if (!practitionerId) {
    throw new BadRequestException('practitionerId is required');
  }

  return this.service.submitReview(dto, practitionerId);
}



}
