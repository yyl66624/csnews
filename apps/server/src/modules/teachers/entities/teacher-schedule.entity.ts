import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TeacherProfile } from '../../users/entities/teacher-profile.entity';

@Entity('teacher_schedules')
export class TeacherSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'teacher_id', type: 'integer' })
  teacherId: number;

  @ManyToOne(() => TeacherProfile, (teacher) => teacher.schedules)
  @JoinColumn({ name: 'teacher_id' })
  teacher: TeacherProfile;

  @Column({ name: 'day_of_week', type: 'integer' })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'varchar', length: 8 })
  startTime: string;

  @Column({ name: 'end_time', type: 'varchar', length: 8 })
  endTime: string;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
