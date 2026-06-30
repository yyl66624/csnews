import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'integer', unique: true })
  userId: number;

  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 32, nullable: true })
  grade: string | null;

  @Column({ type: 'simple-json', nullable: true })
  subjects: string[] | null;

  @Column({ name: 'learning_goal', type: 'text', nullable: true })
  learningGoal: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  city: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
