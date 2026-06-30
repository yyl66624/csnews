import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderPayment } from '../orders/entities/order-payment.entity';
import { OrderStatus, PayStatus } from '../../common/enums';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderPayment) private paymentRepo: Repository<OrderPayment>,
  ) {}

  /** 创建预支付订单（开发模式返回 mock 参数） */
  async createPrepay(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, studentId: userId },
      relations: ['payment'],
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许支付');
    }
    if (order.payment?.payStatus === PayStatus.PAID) {
      throw new BadRequestException('订单已支付');
    }

    // 生产环境：调用微信统一下单 API
    const prepayId = `mock_prepay_${order.orderNo}`;
    await this.paymentRepo.update(
      { orderId },
      { prepayId },
    );

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      totalAmount: Number(order.totalAmount),
      // 小程序 wx.requestPayment 所需参数（开发模式 mock）
      paymentParams: {
        timeStamp: String(Math.floor(Date.now() / 1000)),
        nonceStr: 'mock_nonce',
        package: `prepay_id=${prepayId}`,
        signType: 'RSA',
        paySign: 'mock_sign',
      },
    };
  }

  /** 模拟支付成功（开发环境，校验用户身份） */
  async mockPay(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.studentId !== userId) throw new ForbiddenException('无权操作此订单');
    return this.confirmPayment(orderId);
  }

  /** 支付确认（内部方法） */
  async confirmPayment(orderId: number, transactionId?: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payment'],
    });
    if (!order) throw new NotFoundException('订单不存在');

    await this.paymentRepo.update(
      { orderId },
      {
        payStatus: PayStatus.PAID,
        wxTransactionId: transactionId || `mock_tx_${Date.now()}`,
        paidAt: new Date(),
      },
    );

    // 支付成功后触发分账（生产环境调用微信分账 API）
    await this.paymentRepo.update({ orderId }, { profitSharingStatus: 'completed' });

    return { success: true };
  }

  /** 微信支付回调通知 */
  async handleNotify(_body: unknown) {
    // TODO: 验证签名、更新订单状态、触发分账
    return { code: 'SUCCESS', message: '成功' };
  }
}
