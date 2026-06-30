import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AuditStatus } from '../../../common/enums';
import { User } from './user.entity';
import { TeacherCertificate } from '../../teachers/entities/teacher-certificate.entity';
import { TeacherSubject } from '../../teachers/entities/teacher-subject.entity';
import { TeacherSchedule } from '../../teachers/entities/teacher-schedule.entity';

@Entity('teacher_profiles')
export class TeacherProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'integer', unique: true })
  userId: number;

  @OneToOne(() => User, (user) => user.teacherProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'real_name', type: 'varchar', length: 32, nullable: true })
  realName: string | null;

  @Column({ name: 'id_card', type: 'varchar', length: 32, nullable: true })
  idCard: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  education: string | null;

  @Column({ name: 'teaching_years', type: 'integer', default: 0 })
  teachingYears: number;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'teaching_style', type: 'varchar', length: 256, nullable: true })
  teachingStyle: string | null;

  @Column({ name: 'audit_status', type: 'varchar', length: 20, default: AuditStatus.PENDING })
  auditStatus: AuditStatus;

  @Column({ name: 'reject_reason', type: 'varchar', length: 512, nullable: true })
  rejectReason: string | null;

  @Column({ name: 'hourly_rate', type: 'real', default: 0 })
  hourlyRate: number;

  @Column({ type: 'real', default: 5.0 })
  rating: number;

  @Column({ name: 'review_count', type: 'integer', default: 0 })
  reviewCount: number;

  @Column({ name: 'order_count', type: 'integer', default: 0 })
  orderCount: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  city: string | null;

  @OneToMany(() => TeacherCertificate, (cert) => cert.teacher)
  certificates: TeacherCertificate[];

  @OneToMany(() => TeacherSubject, (subject) => subject.teacher)
  subjects: TeacherSubject[];

  @OneToMany(() => TeacherSchedule, (schedule) => schedule.teacher)
  schedules: TeacherSchedule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
