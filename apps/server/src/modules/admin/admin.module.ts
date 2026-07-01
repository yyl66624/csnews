import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PaymentsModule } from '../payments/payments.module';
import { User } from '../users/entities/user.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TeacherProfile, Order]),
    PaymentsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
