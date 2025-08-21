// src/medical-issues/medical-issues.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MedicalIssuesService } from './medical-issues.service';
import { CreateMedicalIssueDto } from './dto/create-medical-issue.dto';
import { UpdateMedicalIssueDto } from './dto/update-medical-issue.dto';

@Controller('medical-issues')
export class MedicalIssuesController {
  constructor(private readonly service: MedicalIssuesService) {}

  @Post()
  create(@Body() dto: CreateMedicalIssueDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateMedicalIssueDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
