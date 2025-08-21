/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MedicalIssue,
  MedicalIssueDocument,
} from './schema/medical-issue.schema';
import { CreateMedicalIssueDto } from './dto/create-medical-issue.dto';
import { UpdateMedicalIssueDto } from './dto/update-medical-issue.dto';

@Injectable()
export class MedicalIssuesService {
  constructor(
    @InjectModel(MedicalIssue.name)
    private issueModel: Model<MedicalIssueDocument>,
  ) {}

  async create(
    createMedicalIssueDto: CreateMedicalIssueDto,
  ): Promise<MedicalIssue> {
    const { name } = createMedicalIssueDto;

    const existing = await this.issueModel.findOne({ name });
    if (existing) {
      throw new BadRequestException(
        `A medical issue with the name: ${name} already exists`,
      );
    }

    const createdIssue = new this.issueModel(createMedicalIssueDto);
    return createdIssue.save();
  }

  async findAll(): Promise<MedicalIssue[]> {
    return this.issueModel.find().sort({ _id: -1 }).exec();
  }

  async findOne(id: string): Promise<MedicalIssue> {
    const issue = await this.issueModel.findById(id);
    if (!issue) {
      throw new NotFoundException('Medical issue not found');
    }
    return issue;
  }

  async update(
    id: string,
    updateDto: UpdateMedicalIssueDto,
  ): Promise<MedicalIssue> {
    const issue = await this.issueModel.findById(id);
    if (!issue) {
      throw new NotFoundException('Medical issue not found');
    }

    // Optional: Prevent duplicate name
    if (updateDto.name && updateDto.name !== issue.name) {
      const existing = await this.issueModel.findOne({ name: updateDto.name });
      if (existing) {
        throw new BadRequestException(
          `A medical issue with the name:${updateDto.name} already exists`,
        );
      }
    }

    // Apply only provided fields
    for (const key in updateDto) {
      if (updateDto[key] !== undefined) {
        issue[key] = updateDto[key];
      }
    }

    return issue.save();
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.issueModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Medical issue not found');
    }
    return { message: 'Medical issue deleted successfully' };
  }
}
