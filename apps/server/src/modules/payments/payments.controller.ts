import { Controller, Post, Param, ParseIntPipe, ForbiddenException, Headers, Body } from '@nestjs/common';
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

  @Post('sync/:orderId')
  syncStatus(
    @CurrentUser() user: { id: number },
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentsService.syncPaymentStatus(orderId, user.id);
  }

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
  handleNotify(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
  ) {
    return this.paymentsService.handleNotify(headers, body);
  }
}
