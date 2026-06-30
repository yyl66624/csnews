import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../modules/users/entities/user.entity';
import { TeacherProfile } from '../modules/users/entities/teacher-profile.entity';
import { TeacherSubject } from '../modules/teachers/entities/teacher-subject.entity';
import { TeacherSchedule } from '../modules/teachers/entities/teacher-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TeacherProfile, TeacherSubject, TeacherSchedule]),
  ],
  providers: [SeedService],
})
export class DatabaseModule {}
