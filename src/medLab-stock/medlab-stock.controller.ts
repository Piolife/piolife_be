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

interface RequestWithUser extends Request {
  user: { userId: string; username: string };
}
@ApiTags('MedLab Stock')
@Controller('medlab-stock')
export class MedLabStockController {
  constructor(private readonly service: MedLabStockService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new test' })
  @ApiResponse({ status: 201, description: 'Test created successfully.' })
  create(
    @Body() dto: CreateMedLabStockDto,
    @Req() req: RequestWithUser, // <- TS now happy
  ) {
    const userId = req.user.userId; // <- matches JwtStrategy
    return this.service.create(dto, userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all test for the logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'List of test for the user.',
  })
  findAll(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.service.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific test by ID' })
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
  @Patch(':id')
  @ApiOperation({ summary: 'Update stock item' })
  @ApiParam({ name: 'id', description: 'Stock item ID' })
  @ApiBody({ type: MedLabStock })
  updateStock(@Param('id') id: string, @Body() dto: Partial<MedLabStock>) {
    return this.service.updateStock(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock item' })
  @ApiParam({ name: 'id', description: 'Stock item ID' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
