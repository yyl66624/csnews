import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { RiskModule } from '../risk/risk.module';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Order, TeacherProfile]),
    RiskModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
