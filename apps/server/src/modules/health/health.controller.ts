import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/auth.decorators';
import { WechatPayClient } from '../payments/wechat-pay.client';

@Controller('health')
export class HealthController {
  constructor(private wechatPay: WechatPayClient) {}

  @Public()
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    };
  }

  /** P0#1 支付配置状态（联调前检查） */
  @Public()
  @Get('payments')
  getPaymentHealth() {
    const config = this.wechatPay.getConfigStatus();
    return {
      ...config,
      hint: config.ready
        ? '微信支付 APIv3 已配置，可使用真实支付'
        : '当前为 mock 模式，请配置 apps/server/.env 中缺失项后重启',
    };
  }
}
