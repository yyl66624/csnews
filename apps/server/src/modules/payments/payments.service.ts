import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../orders/entities/order.entity';
import { OrderPayment } from '../orders/entities/order-payment.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus, PayStatus } from '../../common/enums';
import { ErrorCode } from '../../common/error-codes';
import { BusinessException } from '../../common/exceptions/business.exception';
import { WechatPayClient, NotifyResource } from './wechat-pay.client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderPayment) private paymentRepo: Repository<OrderPayment>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private wechatPay: WechatPayClient,
    private config: ConfigService,
  ) {}

  /** 创建预支付订单 */
  async createPrepay(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, studentId: userId },
      relations: ['payment'],
    });
    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, undefined, 404);
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID);
    }
    if (order.payment?.payStatus === PayStatus.PAID) {
      throw new BusinessException(ErrorCode.ORDER_ALREADY_PAID);
    }

    if (this.wechatPay.isConfigured()) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user?.openid) {
        throw new BusinessException(ErrorCode.BAD_REQUEST, '用户 openid 缺失，请重新登录');
      }

      const result = await this.wechatPay.createJsapiOrder({
        description: `${order.subject}-${order.gradeLevel} 课时`,
        outTradeNo: order.orderNo,
        totalAmountYuan: Number(order.totalAmount),
        openid: user.openid,
      });

      await this.paymentRepo.update({ orderId }, { prepayId: result.prepayId });

      return {
        orderId: order.id,
        orderNo: order.orderNo,
        totalAmount: Number(order.totalAmount),
        paymentParams: result.paymentParams,
      };
    }

    // 开发模式 mock
    if (process.env.NODE_ENV === 'production') {
      throw new BusinessException(ErrorCode.PAYMENT_NOT_CONFIGURED);
    }

    const prepayId = `mock_prepay_${order.orderNo}`;
    await this.paymentRepo.update({ orderId }, { prepayId });

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      totalAmount: Number(order.totalAmount),
      paymentParams: {
        timeStamp: String(Math.floor(Date.now() / 1000)),
        nonceStr: 'mock_nonce',
        package: `prepay_id=${prepayId}`,
        signType: 'RSA' as const,
        paySign: 'mock_sign',
      },
    };
  }

  async mockPay(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, undefined, 404);
    if (order.studentId !== userId) {
      throw new BusinessException(ErrorCode.ORDER_FORBIDDEN, undefined, 403);
    }
    return this.confirmPayment(orderId);
  }

  async confirmPayment(orderId: number, transactionId?: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payment'],
    });
    if (!order) throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, undefined, 404);

    if (order.payment?.payStatus === PayStatus.PAID) {
      return { success: true, alreadyPaid: true };
    }

    const txId = transactionId || `mock_tx_${Date.now()}`;

    await this.paymentRepo.update(
      { orderId },
      {
        payStatus: PayStatus.PAID,
        wxTransactionId: txId,
        paidAt: new Date(),
      },
    );

    // 支付成功后尝试分账（需配置 WX_PROFIT_SHARING_RECEIVER）
    await this.tryProfitSharing(orderId, txId);

    return { success: true };
  }

  /** 微信支付回调 */
  async handleNotify(headers: Record<string, string | string[] | undefined>, body: Record<string, unknown>) {
    try {
      const resource = body.resource as NotifyResource | undefined;
      if (!resource || !this.wechatPay.isConfigured()) {
        this.logger.warn('支付回调缺少 resource 或未配置微信支付');
        return { code: 'SUCCESS', message: '成功' };
      }

      const decrypted = this.wechatPay.decryptNotifyResource(resource);
      const tradeState = decrypted.trade_state as string;
      const outTradeNo = decrypted.out_trade_no as string;
      const transactionId = decrypted.transaction_id as string;

      if (tradeState === 'SUCCESS') {
        const order = await this.orderRepo.findOne({ where: { orderNo: outTradeNo } });
        if (order) {
          await this.confirmPayment(order.id, transactionId);
        }
      }

      return { code: 'SUCCESS', message: '成功' };
    } catch (err) {
      this.logger.error('支付回调处理失败', err);
      throw new BusinessException(ErrorCode.PAYMENT_NOTIFY_INVALID);
    }
  }

  /** 支付状态同步（补偿机制） */
  async syncPaymentStatus(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, studentId: userId },
      relations: ['payment'],
    });
    if (!order) throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, undefined, 404);
    if (!this.wechatPay.isConfigured()) {
      return { payStatus: order.payment?.payStatus || PayStatus.UNPAID, synced: false };
    }

    const result = await this.wechatPay.queryByOutTradeNo(order.orderNo);
    if (result.tradeState === 'SUCCESS') {
      await this.confirmPayment(orderId, result.transactionId);
      return { payStatus: PayStatus.PAID, synced: true };
    }

    return { payStatus: order.payment?.payStatus || PayStatus.UNPAID, synced: true, tradeState: result.tradeState };
  }

  /** 管理员退款 */
  async refundOrder(orderId: number, reason?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['payment'] });
    if (!order) throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, undefined, 404);
    if (order.payment?.payStatus !== PayStatus.PAID) {
      throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID, '仅已支付订单可退款');
    }

    if (this.wechatPay.isConfigured()) {
      try {
        await this.wechatPay.createRefund({
          outTradeNo: order.orderNo,
          outRefundNo: `RF${order.orderNo}${Date.now()}`,
          totalYuan: Number(order.totalAmount),
          refundYuan: Number(order.totalAmount),
          reason,
        });
      } catch (err) {
        this.logger.error('微信退款失败', err);
        throw new BusinessException(ErrorCode.REFUND_FAILED);
      }
    }

    await this.paymentRepo.update({ orderId }, { payStatus: PayStatus.REFUNDED });
    await this.orderRepo.update(orderId, { status: OrderStatus.REFUNDED, cancelReason: reason || '管理员退款' });

    return { success: true };
  }

  private async tryProfitSharing(orderId: number, transactionId: string) {
    const receiver = this.config.get<string>('WX_PROFIT_SHARING_RECEIVER');
    if (!receiver || !this.wechatPay.isConfigured()) {
      await this.paymentRepo.update({ orderId }, { profitSharingStatus: 'skipped' });
      return;
    }

    try {
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!order) return;

      const teacherAmount = Math.round(Number(order.lessonFee) * 100);
      await this.wechatPay.createProfitSharing({
        transactionId,
        outOrderNo: `PS${order.orderNo}${uuidv4().slice(0, 8)}`,
        receivers: [
          {
            type: 'MERCHANT_ID',
            account: receiver,
            amount: teacherAmount,
            description: '课时费分账',
          },
        ],
      });
      await this.paymentRepo.update({ orderId }, { profitSharingStatus: 'completed' });
    } catch (err) {
      this.logger.warn('分账失败，待补偿', err);
      await this.paymentRepo.update({ orderId }, { profitSharingStatus: 'pending' });
    }
  }
}
