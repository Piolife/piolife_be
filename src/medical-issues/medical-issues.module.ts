import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalIssuesService } from './medical-issues.service';
import { MedicalIssuesController } from './medical-issues.controller';
import { MedicalIssue, MedicalIssueSchema } from './schema/medical-issue.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: MedicalIssue.name, schema: MedicalIssueSchema }]),
  ],
  controllers: [MedicalIssuesController],
  providers: [MedicalIssuesService],
})
export class MedicalIssuesModule {}
