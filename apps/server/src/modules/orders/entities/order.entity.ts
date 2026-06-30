import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { OrderStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { OrderPayment } from './order-payment.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_no', type: 'varchar', length: 32, unique: true })
  orderNo: string;

  @Column({ name: 'student_id', type: 'integer' })
  studentId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'teacher_id', type: 'integer' })
  teacherId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'varchar', length: 32 })
  subject: string;

  @Column({ name: 'grade_level', type: 'varchar', length: 32 })
  gradeLevel: string;

  @Column({ name: 'lesson_date', type: 'varchar', length: 10 })
  lessonDate: string;

  @Column({ name: 'start_time', type: 'varchar', length: 8 })
  startTime: string;

  @Column({ name: 'end_time', type: 'varchar', length: 8 })
  endTime: string;

  @Column({ name: 'lesson_fee', type: 'decimal', precision: 10, scale: 2 })
  lessonFee: number;

  @Column({ name: 'service_fee', type: 'decimal', precision: 10, scale: 2 })
  serviceFee: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'service_fee_rate', type: 'decimal', precision: 4, scale: 2, default: 0.07 })
  serviceFeeRate: number;

  @Column({ type: 'varchar', length: 20, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  requirement: string | null;

  @Column({ name: 'cancel_reason', type: 'varchar', length: 512, nullable: true })
  cancelReason: string | null;

  @OneToOne(() => OrderPayment, (payment) => payment.order)
  payment: OrderPayment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
