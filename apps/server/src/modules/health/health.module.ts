import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [HealthController],
})
export class HealthModule {}
