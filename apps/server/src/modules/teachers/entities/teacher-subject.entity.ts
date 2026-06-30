import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TeacherProfile } from '../../users/entities/teacher-profile.entity';

@Entity('teacher_subjects')
export class TeacherSubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'teacher_id', type: 'integer' })
  teacherId: number;

  @ManyToOne(() => TeacherProfile, (teacher) => teacher.subjects)
  @JoinColumn({ name: 'teacher_id' })
  teacher: TeacherProfile;

  @Column({ type: 'varchar', length: 32 })
  subject: string;

  @Column({ name: 'grade_level', type: 'varchar', length: 32 })
  gradeLevel: string;

  @Column({ type: 'real' })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
