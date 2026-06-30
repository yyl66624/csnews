import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { Order } from '../orders/entities/order.entity';
import { AuditStatus, UserRole } from '../../common/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(TeacherProfile) private teacherRepo: Repository<TeacherProfile>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async getDashboard() {
    const [userCount, teacherCount, orderCount, pendingAudits] = await Promise.all([
      this.userRepo.count({ where: { role: UserRole.STUDENT } }),
      this.teacherRepo.count({ where: { auditStatus: AuditStatus.APPROVED } }),
      this.orderRepo.count(),
      this.teacherRepo.count({ where: { auditStatus: AuditStatus.PENDING } }),
    ]);

    const gmvResult = await this.orderRepo
      .createQueryBuilder('o')
      .select('SUM(o.total_amount)', 'gmv')
      .where('o.status IN (:...statuses)', {
        statuses: ['confirmed', 'in_progress', 'completed'],
      })
      .getRawOne();

    return {
      userCount,
      teacherCount,
      orderCount,
      pendingAudits,
      gmv: Number(gmvResult?.gmv) || 0,
    };
  }

  async listTeachers(auditStatus?: AuditStatus, page = 1, pageSize = 10) {
    const where = auditStatus ? { auditStatus } : {};
    const [items, total] = await this.teacherRepo.findAndCount({
      where,
      relations: ['user', 'certificates', 'subjects'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map((t) => ({
        id: t.id,
        userId: t.userId,
        nickname: t.user?.nickname,
        realName: t.realName,
        education: t.education,
        teachingYears: t.teachingYears,
        auditStatus: t.auditStatus,
        rejectReason: t.rejectReason,
        certificates: t.certificates,
        subjects: t.subjects,
        createdAt: t.createdAt,
      })),
      total,
    };
  }

  async auditTeacher(teacherId: number, approved: boolean, rejectReason?: string) {
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('教师不存在');

    teacher.auditStatus = approved ? AuditStatus.APPROVED : AuditStatus.REJECTED;
    teacher.rejectReason = approved ? null : rejectReason || '审核未通过';
    await this.teacherRepo.save(teacher);
    return { success: true };
  }

  async listUsers(role?: UserRole, page = 1, pageSize = 10) {
    const where = role ? { role } : {};
    const [items, total] = await this.userRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  async listOrders(status?: string, page = 1, pageSize = 10) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.student', 'student')
      .leftJoinAndSelect('o.teacher', 'teacher')
      .leftJoinAndSelect('o.payment', 'payment');

    if (status) qb.where('o.status = :status', { status });
    qb.orderBy('o.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
