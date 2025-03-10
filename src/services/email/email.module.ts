import { Module } from '@nestjs/common';
import { EmailService } from './email.sevice';


@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
