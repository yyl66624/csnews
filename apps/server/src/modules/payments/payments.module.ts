import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WechatPayClient } from './wechat-pay.client';
import { Order } from '../orders/entities/order.entity';
import { OrderPayment } from '../orders/entities/order-payment.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderPayment, User])],
  controllers: [PaymentsController],
  providers: [PaymentsService, WechatPayClient],
  exports: [PaymentsService, WechatPayClient],
})
export class PaymentsModule {}
