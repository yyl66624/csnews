import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { PayStatus } from '../../../common/enums';
import { Order } from './order.entity';

@Entity('order_payments')
export class OrderPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id', type: 'integer', unique: true })
  orderId: number;

  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'wx_transaction_id', type: 'varchar', length: 64, nullable: true })
  wxTransactionId: string | null;

  @Column({ name: 'prepay_id', type: 'varchar', length: 64, nullable: true })
  prepayId: string | null;

  @Column({ name: 'pay_status', type: 'varchar', length: 20, default: PayStatus.UNPAID })
  payStatus: PayStatus;

  @Column({
    name: 'profit_sharing_status',
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  profitSharingStatus: string;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
