// sessions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Session, SessionSchema } from './schema/session.schema';
import { User, UserSchema } from 'src/user/Schema/user.schema';
import { WalletModule } from 'src/wallet/wallet.module';
import { MedicalIssue, MedicalIssueSchema } from 'src/medical-issues/schema/medical-issue.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: User.name, schema: UserSchema },
      { name: MedicalIssue.name, schema: MedicalIssueSchema }
    ]),
    WalletModule
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
