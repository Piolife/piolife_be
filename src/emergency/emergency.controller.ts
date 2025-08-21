/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Convert an address to latitude and longitude' })
  @ApiResponse({ status: 200, description: 'Returns geocoded coordinates.' })
  async geocode(@Body() formData: geoLocationDto) {
    return this.service.geocodeAddress(formData);
  }

  @Post('handle-emergency')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Handle an emergency service request' })
  @ApiResponse({
    status: 201,
    description: 'Emergency request processed successfully.',
  })
  async handleEmergency(
    @Req() req: RequestWithUser,
    @Body() formData: CallEmergencyFormData,
  ) {
    return this.service.handleEmergencyRequest(req.user.userId, formData);
  }

  @Get('emergencies/:facilityId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Fetch all emergencies for a specific facility' })
  @ApiResponse({
    status: 200,
    description: 'List of emergencies for the given facility.',
  })
  async getEmergenciesByFacility(@Param('facilityId') facilityId: string) {
    return this.service.getEmergenciesByFacility(facilityId);
  }
}
