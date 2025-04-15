import { Controller, Post, Get, Body, Patch, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionStatusDto } from './dto/create-session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
updateStatus(
  @Param('id') sessionId: string,
  @Body() dto: UpdateSessionStatusDto,
) {
  return this.service.updateSessionStatus(sessionId, dto.status);
}


//   @Get()
//   findAll() {
//     return this.service.findAll();
//   }
}
