import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { TeacherProfile } from '../modules/users/entities/teacher-profile.entity';
import { TeacherSubject } from '../modules/teachers/entities/teacher-subject.entity';
import { TeacherSchedule } from '../modules/teachers/entities/teacher-schedule.entity';
import { AuditStatus, UserRole } from '../common/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(TeacherProfile) private teacherRepo: Repository<TeacherProfile>,
    @InjectRepository(TeacherSubject) private subjectRepo: Repository<TeacherSubject>,
    @InjectRepository(TeacherSchedule) private scheduleRepo: Repository<TeacherSchedule>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
    await this.seedDemoTeachers();
  }

  private async seedAdmin() {
    const exists = await this.userRepo.findOne({
      where: { openid: 'dev_admin_openid_placeholder' },
    });
    if (exists) return;

    await this.userRepo.save(
      this.userRepo.create({
        openid: 'dev_admin_openid_placeholder',
        nickname: '系统管理员',
        role: UserRole.ADMIN,
        phone: '13800000000',
      }),
    );
    this.logger.log('已创建管理员账号');
  }

  private async seedDemoTeachers() {
    const count = await this.teacherRepo.count({ where: { auditStatus: AuditStatus.APPROVED } });
    if (count > 0) return;

    const demos = [
      {
        openid: 'dev_teacher_001',
        nickname: '张老师',
        realName: '张明',
        education: '硕士',
        teachingYears: 8,
        bio: '专注初中数学辅导，擅长因材施教，帮助多名学生提高成绩。',
        teachingStyle: '耐心细致',
        city: '北京',
        rating: 4.9,
        subjects: [
          { subject: '数学', gradeLevel: '初中', price: 150 },
          { subject: '数学', gradeLevel: '高中', price: 200 },
        ],
        schedules: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
          { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
          { dayOfWeek: 6, startTime: '09:00', endTime: '17:00' },
        ],
      },
      {
        openid: 'dev_teacher_002',
        nickname: '李老师',
        realName: '李芳',
        education: '本科',
        teachingYears: 5,
        bio: '英语专业八级，口语流利，注重培养学习兴趣和语感。',
        teachingStyle: '生动有趣',
        city: '上海',
        rating: 4.8,
        subjects: [
          { subject: '英语', gradeLevel: '小学', price: 120 },
          { subject: '英语', gradeLevel: '初中', price: 150 },
        ],
        schedules: [
          { dayOfWeek: 2, startTime: '10:00', endTime: '12:00' },
          { dayOfWeek: 4, startTime: '15:00', endTime: '19:00' },
        ],
      },
      {
        openid: 'dev_teacher_003',
        nickname: '王老师',
        realName: '王强',
        education: '博士',
        teachingYears: 10,
        bio: '重点高中物理教师，精通中高考物理考点，方法论清晰。',
        teachingStyle: '逻辑严谨',
        city: '广州',
        rating: 5.0,
        subjects: [
          { subject: '物理', gradeLevel: '高中', price: 250 },
          { subject: '化学', gradeLevel: '高中', price: 230 },
        ],
        schedules: [
          { dayOfWeek: 0, startTime: '09:00', endTime: '12:00' },
          { dayOfWeek: 5, startTime: '18:00', endTime: '21:00' },
        ],
      },
    ];

    for (const demo of demos) {
      let user = await this.userRepo.findOne({ where: { openid: demo.openid } });
      if (!user) {
        user = await this.userRepo.save(
          this.userRepo.create({
            openid: demo.openid,
            nickname: demo.nickname,
            role: UserRole.TEACHER,
          }),
        );
      }

      const profile = await this.teacherRepo.save(
        this.teacherRepo.create({
          userId: user.id,
          realName: demo.realName,
          education: demo.education,
          teachingYears: demo.teachingYears,
          bio: demo.bio,
          teachingStyle: demo.teachingStyle,
          city: demo.city,
          rating: demo.rating,
          auditStatus: AuditStatus.APPROVED,
        }),
      );

      for (const s of demo.subjects) {
        await this.subjectRepo.save(
          this.subjectRepo.create({ teacherId: profile.id, ...s }),
        );
      }
      for (const s of demo.schedules) {
        await this.scheduleRepo.save(
          this.scheduleRepo.create({ teacherId: profile.id, ...s }),
        );
      }
    }

    this.logger.log('已导入演示教师数据');
  }
}
