import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { RiskModule } from '../risk/risk.module';
import { Order } from './entities/order.entity';
import { OrderPayment } from './entities/order-payment.entity';
import { TeacherSubject } from '../teachers/entities/teacher-subject.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderPayment, TeacherSubject, TeacherProfile]),
    RiskModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
