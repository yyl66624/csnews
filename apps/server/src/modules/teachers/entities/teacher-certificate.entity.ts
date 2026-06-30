import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditStatus, CertType } from '../../../common/enums';
import { TeacherProfile } from '../../users/entities/teacher-profile.entity';

@Entity('teacher_certificates')
export class TeacherCertificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'teacher_id', type: 'integer' })
  teacherId: number;

  @ManyToOne(() => TeacherProfile, (teacher) => teacher.certificates)
  @JoinColumn({ name: 'teacher_id' })
  teacher: TeacherProfile;

  @Column({ name: 'cert_type', type: 'varchar', length: 32 })
  certType: CertType;

  @Column({ name: 'image_url', type: 'varchar', length: 512 })
  imageUrl: string;

  @Column({ name: 'audit_status', type: 'varchar', length: 20, default: AuditStatus.PENDING })
  auditStatus: AuditStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
