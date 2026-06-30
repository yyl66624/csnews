import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { User } from '../users/entities/user.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { TeacherCertificate } from './entities/teacher-certificate.entity';
import { TeacherSubject } from './entities/teacher-subject.entity';
import { TeacherSchedule } from './entities/teacher-schedule.entity';
import { Review } from '../reviews/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      TeacherProfile,
      TeacherCertificate,
      TeacherSubject,
      TeacherSchedule,
      Review,
    ]),
  ],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
