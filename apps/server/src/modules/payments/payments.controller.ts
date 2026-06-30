import { Controller, Post, Body, Param, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/auth.decorators';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('prepay/:orderId')
  createPrepay(
    @CurrentUser() user: { id: number },
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentsService.createPrepay(user.id, orderId);
  }

  /** 开发环境模拟支付成功，生产环境自动禁用 */
  @Post('mock-success/:orderId')
  mockSuccess(
    @CurrentUser() user: { id: number },
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('生产环境不提供此接口');
    }
    return this.paymentsService.mockPay(user.id, orderId);
  }

  @Public()
  @Post('notify')
  handleNotify(@Body() body: unknown) {
    return this.paymentsService.handleNotify(body);
  }
}
