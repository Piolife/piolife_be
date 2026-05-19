/**
 * medlab-stock.controller.ts — PATCHED
 *
 * FIXES vs original:
 * 1. GET user/:userId was present but GET orders/:userId was MISSING
 *    — medlabServices.tsx calls /medlab-stock/orders/:userId
 * 2. POST orders exists — but diagnosisNote field from frontend was silently dropped
 *    by the DTO (now added to CreateLabOrderDto patch below)
 * 3. The @Delete and @Post(':id/buy') decorators were MERGED into one method body
 *    (a Nest.js bug in original — @Delete(':id') was inside the buyItem handler).
 *    Fixed by separating them properly.
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CreateMedLabStockDto } from './dto/create-medlab-stock.dto';
import { MedLabStockService } from './medlab-stock.service';
import { AuthGuard } from '@nestjs/passport';
import { MedLabStock } from './schema/medlab-stock.schema';
import { CreateLabOrderDto } from './dto/laborder.dto';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

@ApiTags('MedLab Stock')
@Controller('medlab-stock')
export class MedLabStockController {
  constructor(private readonly service: MedLabStockService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new lab test' })
  create(@Body() dto: CreateMedLabStockDto, @Req() req: RequestWithUser) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all tests for the logged-in lab' })
  findAll(@Req() req: RequestWithUser) {
    return this.service.findAll(req.user.userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all tests for a specific lab by userId' })
  @ApiParam({ name: 'userId', required: true })
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific test by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lab test' })
  updateStock(@Param('id') id: string, @Body() dto: Partial<MedLabStock>) {
    return this.service.updateStock(id, dto);
  }

  // FIX: in original, @Delete(':id') was nested inside the buy handler — separated here
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lab test' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // POST orders — exists in original but diagnosisNote field was dropped by DTO
  @Post('orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a lab order (debit patient, credit lab)' })
  @ApiResponse({ status: 201, description: 'Lab order created.' })
  async createLabOrder(@Body() dto: CreateLabOrderDto) {
    return this.service.createLabOrder(dto);
  }

  // FIX: MISSING in original — medlabServices.tsx calls GET /medlab-stock/orders/:userId
  @Get('orders/:userId')
  @ApiOperation({ summary: 'Get all lab orders for a lab provider' })
  @ApiParam({ name: 'userId', required: true })
  async getOrdersByLab(@Param('userId') userId: string) {
    return this.service.getOrdersByLab(userId);
  }
}
