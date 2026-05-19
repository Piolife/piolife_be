/**
 * estate.controller.ts — NEW
 * Pioland real estate API.
 */
import {
  Controller, Post, Get, Patch, Body,
  Param, UseGuards, Req,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiParam,
  ApiBody, ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EstateService } from './estate.service';
import { CreateEstateOrderDto, MakeInstalmentDto } from './dto/estate.dto';

interface RequestWithUser extends Request {
  user: { userId: string };
}

@ApiTags('Estate (Pioland)')
@Controller('estate')
export class EstateController {
  constructor(private readonly estateService: EstateService) {}

  // POST /api/v12/estate/orders — create order + deduct first payment
  @Post('orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a Pioland purchase order (first payment)' })
  @ApiResponse({ status: 201, description: 'Order created and first payment deducted.' })
  async createOrder(
    @Body() dto: CreateEstateOrderDto,
    @Req() req: RequestWithUser,
  ) {
    dto.userId = req.user.userId;
    return this.estateService.createOrder(dto);
  }

  // GET /api/v12/estate/orders/my — client's own orders
  @Get('orders/my')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Get current user's property orders" })
  async getMyOrders(@Req() req: RequestWithUser) {
    return this.estateService.getOrdersByUser(req.user.userId);
  }

  // GET /api/v12/estate/orders/user/:userId — admin view
  @Get('orders/user/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Get a user's property orders (admin)" })
  @ApiParam({ name: 'userId', required: true })
  async getOrdersByUser(@Param('userId') userId: string) {
    return this.estateService.getOrdersByUser(userId);
  }

  // GET /api/v12/estate/orders/:orderId — single order detail
  @Get('orders/:orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get a single order by ID' })
  async getOrder(
    @Param('orderId') orderId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.estateService.getOrderById(orderId, req.user.userId);
  }

  // POST /api/v12/estate/orders/:orderId/pay — make instalment payment
  @Post('orders/:orderId/pay')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Make an instalment payment on an estate order' })
  @ApiParam({ name: 'orderId', required: true })
  @ApiBody({ type: MakeInstalmentDto })
  @ApiResponse({ status: 200, description: 'Payment made, tracker updated.' })
  async makeInstalment(
    @Param('orderId') orderId: string,
    @Body() dto: MakeInstalmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.estateService.makeInstalment(orderId, req.user.userId, dto);
  }

  // PATCH /api/v12/estate/orders/:orderId/default — admin applies default charge
  @Patch('orders/:orderId/default')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Apply default charge to an overdue order (admin)' })
  async applyDefault(@Param('orderId') orderId: string) {
    return this.estateService.applyDefault(orderId);
  }

  // GET /api/v12/estate/orders — admin: all orders
  @Get('orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all estate orders (admin)' })
  async getAllOrders() {
    return this.estateService.getAllOrders();
  }
}
