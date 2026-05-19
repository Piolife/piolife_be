/**
 * emergency.controller.ts — PATCHED
 *
 * FIXES vs original:
 * 1. POST handle-emergency → renamed to POST emergencies (frontend calls this path)
 * 2. GET emergencies/:facilityId kept — also add GET emergencies/client/:userId
 *    so clients can check status of their own emergency requests
 * 3. Both old and new routes kept for backward compat
 */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  CallEmergencyFormData,
  geoLocationDto,
} from './dto/create-emergency-dto';
import { AuthGuard } from '@nestjs/passport';
import { EmergencyStockService } from './emergency.service';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

@ApiTags('Emergency Stock')
@Controller('emergency-stock')
export class EmergencyStockController {
  constructor(private readonly service: EmergencyStockService) {}

  @Post('geocode')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Convert an address to coordinates' })
  async geocode(@Body() formData: geoLocationDto) {
    return this.service.geocodeAddress(formData);
  }

  // Original route — kept for backward compat
  @Post('handle-emergency')
  @UseGuards(AuthGuard('jwt'))
  async handleEmergencyLegacy(
    @Req() req: RequestWithUser,
    @Body() formData: CallEmergencyFormData,
  ) {
    return this.service.handleEmergencyRequest(req.user.userId, formData);
  }

  // FIX: frontend emergencyMenu.tsx calls POST /emergency-stock/emergencies
  @Post('emergencies')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Dispatch an emergency (new route used by frontend)',
  })
  async handleEmergency(
    @Req() req: RequestWithUser,
    @Body() formData: CallEmergencyFormData,
  ) {
    return this.service.handleEmergencyRequest(req.user.userId, formData);
  }

  // Facility / provider view
  @Get('emergencies/:facilityId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all emergencies for a facility' })
  @ApiParam({ name: 'facilityId', required: true })
  async getEmergenciesByFacility(@Param('facilityId') facilityId: string) {
    return this.service.getEmergenciesByFacility(facilityId);
  }

  // FIX: MISSING — client needs to see their own emergency status
  @Get('emergencies/client/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all emergency requests made by a client' })
  @ApiParam({ name: 'userId', required: true })
  async getEmergenciesByClient(@Param('userId') userId: string) {
    return this.service.getEmergenciesByClient(userId);
  }
}
