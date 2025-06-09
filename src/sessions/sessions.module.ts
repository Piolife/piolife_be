// sessions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
// import { Session, SessionSchema } from './schema/session.schema';
import { User, UserSchema } from 'src/user/Schema/user.schema';
import { WalletModule } from 'src/wallet/wallet.module';
import { MedicalIssue, MedicalIssueSchema } from 'src/medical-issues/schema/medical-issue.schema';
import { Wallet, WalletSchema } from 'src/wallet/schema/wallet.schema';
import { Review, ReviewSchema } from './schema/review.schema';
import { Session, SessionSchema } from './schema/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: User.name, schema: UserSchema },
      { name: MedicalIssue.name, schema: MedicalIssueSchema },
      { name:Wallet.name, schema: WalletSchema },
      { name:Review.name, schema: ReviewSchema }
    ]),
    WalletModule
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
