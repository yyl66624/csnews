import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { StudentProfile } from './entities/student-profile.entity';
import { UpdateStudentProfileDto, BindPhoneDto } from './dto/user.dto';
import { maskPhone } from '../../common/utils/mask.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(StudentProfile) private studentRepo: Repository<StudentProfile>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['studentProfile', 'teacherProfile'],
    });
    if (!user) throw new NotFoundException('用户不存在');
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: maskPhone(user.phone),
      role: user.role,
      studentProfile: user.studentProfile,
      teacherProfile: user.teacherProfile,
    };
  }

  async updateStudentProfile(userId: number, dto: UpdateStudentProfileDto) {
    let profile = await this.studentRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.studentRepo.create({ userId, ...dto });
    } else {
      Object.assign(profile, dto);
    }
    return this.studentRepo.save(profile);
  }

  async bindPhone(userId: number, dto: BindPhoneDto) {
    await this.userRepo.update(userId, { phone: dto.phone });
    return { success: true };
  }
}
