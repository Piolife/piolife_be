/**
 * pharmacy-stock.controller.ts — PATCHED
 *
 * FIXES vs original:
 * 1. GET user/:userId was MISSING — frontend calls /pharmacy-stock/user/:userId
 *    to fetch a specific pharmacy's drugs. Original only had GET / (all for logged user).
 * 2. POST orders was MISSING — frontend calls /pharmacy-stock/orders to place drug orders.
 * 3. GET orders/:userId was MISSING — pharmServices.tsx calls this.
 * 4. GET sales/:practitionerId renamed param to userId for consistency.
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
import { CreatePharmacyStockDto } from './dto/create-pharmacy-stock.dto';
import { PharmacyStockService } from './pharmacy-stock.service';
import { PharmacyStock } from './schema/pharmacy-stock.schema';
import { AuthGuard } from '@nestjs/passport';
import { BuyItemDto } from './dto/buy-drug.dto';

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}

@ApiTags('Pharmacy Stock')
@Controller('pharmacy-stock')
export class PharmacyStockController {
  constructor(private readonly service: PharmacyStockService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new stock item' })
  create(@Body() dto: CreatePharmacyStockDto, @Req() req: RequestWithUser) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all stock items for the logged-in pharmacy' })
  findAll(@Req() req: RequestWithUser) {
    return this.service.findAll(req.user.userId);
  }

  // FIX: added — frontend drugs.tsx and pharmDrugs.tsx call GET /pharmacy-stock/user/:userId
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all stock for a specific pharmacy by userId' })
  @ApiParam({ name: 'userId', required: true })
  findByUser(@Param('userId') userId: string) {
    return this.service.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific stock item by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // FIX: added — pharmDrugs.tsx calls POST /pharmacy-stock/orders
  // Also accepts quantities (map of id→qty), withDelivery, prescriptionId from frontend
  @Post('orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Place a drug order (deduct wallet, notify pharmacy)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['drugIds', 'userId', 'pharmacyId'],
      properties: {
        drugIds: { type: 'array', items: { type: 'string' } },
        quantities: { type: 'object', description: 'Map of drugId → quantity' },
        userId: { type: 'string' },
        pharmacyId: { type: 'string' },
        withDelivery: { type: 'boolean' },
        prescriptionId: { type: 'string' },
      },
    },
  })
  async createOrder(
    @Body()
    body: {
      drugIds: string[];
      quantities?: Record<string, number>;
      userId: string;
      pharmacyId: string;
      withDelivery?: boolean;
      prescriptionId?: string;
    },
  ) {
    return this.service.createOrder(
      body.drugIds,
      body.userId,
      body.pharmacyId,
      body.quantities,
      body.withDelivery,
      body.prescriptionId,
    );
  }

  // FIX: added — pharmServices.tsx calls GET /pharmacy-stock/orders/:userId
  @Get('orders/:userId')
  @ApiOperation({ summary: 'Get all orders for a pharmacy' })
  @ApiParam({ name: 'userId', required: true })
  async getOrders(@Param('userId') userId: string) {
    return this.service.getOrdersByPharmacy(userId);
  }

  @Post('buy')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Buy stock items (legacy endpoint)' })
  async buyItems(@Body() dto: BuyItemDto) {
    return this.service.buyItems(dto.items, dto.userId, dto.practitionerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update stock item' })
  updateStock(@Param('id') id: string, @Body() dto: Partial<PharmacyStock>) {
    return this.service.updateStock(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock item' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get('sales/:userId')
  @ApiOperation({ summary: 'Get sales for a pharmacy' })
  async getSales(@Param('userId') userId: string) {
    return this.service.getSales(userId);
  }
}
