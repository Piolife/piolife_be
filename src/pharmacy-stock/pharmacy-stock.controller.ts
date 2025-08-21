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
  @ApiResponse({ status: 201, description: 'Stock item created successfully.' })
  create(@Body() dto: CreatePharmacyStockDto, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.service.create(dto, userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all stock items for the logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'List of stock items for the user.',
  })
  findAll(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.service.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific stock item by ID' })
  @ApiParam({ name: 'id', description: 'Stock item ID' })
  @ApiResponse({ status: 200, description: 'Stock item retrieved.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/buy')
  @ApiOperation({ summary: 'Buy a stock item' })
  @ApiParam({ name: 'id', description: 'Stock item ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: { type: 'number' },
        userId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Item bought successfully.' })
  async buyItem(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('userId') userId: string,
  ) {
    return this.service.buyItem(id, quantity, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update stock item' })
  @ApiParam({ name: 'id', description: 'Stock item ID' })
  @ApiBody({ type: PharmacyStock })
  updateStock(@Param('id') id: string, @Body() dto: Partial<PharmacyStock>) {
    return this.service.updateStock(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock item' })
  @ApiParam({ name: 'id', description: 'Stock item ID' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
