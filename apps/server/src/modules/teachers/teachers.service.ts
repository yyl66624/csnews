import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { TeacherCertificate } from './entities/teacher-certificate.entity';
import { TeacherSubject } from './entities/teacher-subject.entity';
import { TeacherSchedule } from './entities/teacher-schedule.entity';
import { Review } from '../reviews/entities/review.entity';
import { AuditStatus, UserRole } from '../../common/enums';
import {
  SearchTeachersDto,
  ApplyTeacherDto,
  UpdateTeacherProfileDto,
  UploadCertificateDto,
} from './dto/teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(TeacherProfile) private teacherRepo: Repository<TeacherProfile>,
    @InjectRepository(TeacherCertificate) private certRepo: Repository<TeacherCertificate>,
    @InjectRepository(TeacherSubject) private subjectRepo: Repository<TeacherSubject>,
    @InjectRepository(TeacherSchedule) private scheduleRepo: Repository<TeacherSchedule>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
  ) {}

  async search(dto: SearchTeachersDto) {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 10;

    const qb = this.teacherRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'user')
      .leftJoinAndSelect('t.subjects', 'subjects')
      .where('t.auditStatus = :status', { status: AuditStatus.APPROVED })
      .distinct(true);

    if (dto.subject) {
      qb.andWhere('subjects.subject = :subject', { subject: dto.subject });
    }
    if (dto.gradeLevel) {
      qb.andWhere('subjects.gradeLevel = :gradeLevel', { gradeLevel: dto.gradeLevel });
    }
    if (dto.minPrice) {
      qb.andWhere('subjects.price >= :minPrice', { minPrice: dto.minPrice });
    }
    if (dto.maxPrice) {
      qb.andWhere('subjects.price <= :maxPrice', { maxPrice: dto.maxPrice });
    }
    if (dto.city) {
      qb.andWhere('t.city = :city', { city: dto.city });
    }

    switch (dto.sortBy) {
      case 'price':
        qb.orderBy('subjects.price', 'ASC');
        break;
      case 'experience':
        qb.orderBy('t.teachingYears', 'DESC');
        break;
      default:
        qb.orderBy('t.rating', 'DESC');
    }

    qb.skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((t) => this.formatTeacherListItem(t)),
      total,
      page,
      pageSize,
    };
  }

  async getDetail(teacherUserId: number) {
    const teacher = await this.teacherRepo.findOne({
      where: { userId: teacherUserId },
      relations: ['user', 'subjects', 'schedules', 'certificates'],
    });
    if (!teacher) throw new NotFoundException('教师不存在');

    const reviews = await this.reviewRepo.find({
      where: { teacherId: teacherUserId },
      relations: ['student'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      ...this.formatTeacherDetail(teacher),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        content: r.content,
        tags: r.tags,
        isAnonymous: r.isAnonymous,
        studentName: r.isAnonymous ? '匿名用户' : r.student?.nickname,
        createdAt: r.createdAt,
      })),
    };
  }

  async apply(userId: number, dto: ApplyTeacherDto) {
    const existing = await this.teacherRepo.findOne({ where: { userId } });
    if (existing && existing.auditStatus === AuditStatus.APPROVED) {
      throw new BadRequestException('您已通过审核，无需重复申请');
    }

    let profile = existing;
    if (!profile) {
      profile = this.teacherRepo.create({ userId });
    }

    Object.assign(profile, {
      realName: dto.realName,
      idCard: dto.idCard,
      education: dto.education,
      teachingYears: dto.teachingYears,
      bio: dto.bio,
      teachingStyle: dto.teachingStyle,
      city: dto.city,
      auditStatus: AuditStatus.PENDING,
      rejectReason: null,
    });

    await this.teacherRepo.save(profile);
    await this.userRepo.update(userId, { role: UserRole.TEACHER });

    await this.subjectRepo.delete({ teacherId: profile.id });
    for (const s of dto.subjects) {
      await this.subjectRepo.save(
        this.subjectRepo.create({ teacherId: profile.id, ...s }),
      );
    }

    await this.scheduleRepo.delete({ teacherId: profile.id });
    for (const s of dto.schedules) {
      await this.scheduleRepo.save(
        this.scheduleRepo.create({ teacherId: profile.id, ...s }),
      );
    }

    return { success: true, auditStatus: AuditStatus.PENDING };
  }

  async updateProfile(userId: number, dto: UpdateTeacherProfileDto) {
    const profile = await this.teacherRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('教师资料不存在');

    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.teachingStyle !== undefined) profile.teachingStyle = dto.teachingStyle;
    if (dto.city !== undefined) profile.city = dto.city;
    await this.teacherRepo.save(profile);

    if (dto.subjects) {
      await this.subjectRepo.delete({ teacherId: profile.id });
      for (const s of dto.subjects) {
        await this.subjectRepo.save(
          this.subjectRepo.create({ teacherId: profile.id, ...s }),
        );
      }
    }

    if (dto.schedules) {
      await this.scheduleRepo.delete({ teacherId: profile.id });
      for (const s of dto.schedules) {
        await this.scheduleRepo.save(
          this.scheduleRepo.create({ teacherId: profile.id, ...s }),
        );
      }
    }

    return { success: true };
  }

  async uploadCertificate(userId: number, dto: UploadCertificateDto) {
    const profile = await this.teacherRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('请先提交入驻申请');

    const cert = this.certRepo.create({
      teacherId: profile.id,
      certType: dto.certType,
      imageUrl: dto.imageUrl,
    });
    return this.certRepo.save(cert);
  }

  async getMyProfile(userId: number) {
    const profile = await this.teacherRepo.findOne({
      where: { userId },
      relations: ['subjects', 'schedules', 'certificates'],
    });
    if (!profile) return null;
    return this.formatTeacherDetail(profile);
  }

  private formatTeacherListItem(t: TeacherProfile) {
    const minPrice = t.subjects?.length
      ? Math.min(...t.subjects.map((s) => Number(s.price)))
      : Number(t.hourlyRate);
    return {
      id: t.userId,
      nickname: t.user?.nickname,
      avatarUrl: t.user?.avatarUrl,
      realName: t.realName,
      education: t.education,
      teachingYears: t.teachingYears,
      teachingStyle: t.teachingStyle,
      rating: Number(t.rating),
      reviewCount: t.reviewCount,
      city: t.city,
      minPrice,
      subjects: t.subjects?.map((s) => ({
        subject: s.subject,
        gradeLevel: s.gradeLevel,
        price: Number(s.price),
      })),
    };
  }

  private formatTeacherDetail(t: TeacherProfile) {
    return {
      id: t.userId,
      nickname: t.user?.nickname,
      avatarUrl: t.user?.avatarUrl,
      realName: t.realName,
      education: t.education,
      teachingYears: t.teachingYears,
      bio: t.bio,
      teachingStyle: t.teachingStyle,
      rating: Number(t.rating),
      reviewCount: t.reviewCount,
      orderCount: t.orderCount,
      city: t.city,
      auditStatus: t.auditStatus,
      rejectReason: t.rejectReason,
      subjects: t.subjects?.map((s) => ({
        id: s.id,
        subject: s.subject,
        gradeLevel: s.gradeLevel,
        price: Number(s.price),
      })),
      schedules: t.schedules?.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable,
      })),
      certificates: t.certificates?.map((c) => ({
        id: c.id,
        certType: c.certType,
        imageUrl: c.imageUrl,
        auditStatus: c.auditStatus,
      })),
    };
  }
}
