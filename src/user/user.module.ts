import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './Schema/user.schema';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryModule } from 'src/services/cloudinary/cloudinary.module';
import { EmailModule } from 'src/services/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
    ]),
    CloudinaryModule, EmailModule
  ],
  controllers: [UserController],
  providers: [UserService, JwtService]
})
export class UserModule {}
