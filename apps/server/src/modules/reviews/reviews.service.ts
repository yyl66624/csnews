import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { OrderStatus } from '../../common/enums';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(TeacherProfile) private teacherRepo: Repository<TeacherProfile>,
  ) {}

  async create(studentId: number, dto: CreateReviewDto) {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.studentId !== studentId) throw new ForbiddenException('无权评价此订单');
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('仅已完成订单可评价');
    }

    const existing = await this.reviewRepo.findOne({ where: { orderId: dto.orderId } });
    if (existing) throw new BadRequestException('该订单已评价');

    const review = this.reviewRepo.create({
      orderId: dto.orderId,
      studentId,
      teacherId: order.teacherId,
      rating: dto.rating,
      content: dto.content || null,
      tags: dto.tags || null,
      isAnonymous: dto.isAnonymous || false,
    });
    await this.reviewRepo.save(review);

    await this.updateTeacherRating(order.teacherId);
    return review;
  }

  async getByTeacher(teacherId: number, page = 1, pageSize = 10) {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { teacherId },
      relations: ['student'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        content: r.content,
        tags: r.tags,
        isAnonymous: r.isAnonymous,
        studentName: r.isAnonymous ? '匿名用户' : r.student?.nickname,
        createdAt: r.createdAt,
      })),
      total,
    };
  }

  private async updateTeacherRating(teacherUserId: number) {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.teacher_id = :teacherId', { teacherId: teacherUserId })
      .getRawOne();

    await this.teacherRepo.update(
      { userId: teacherUserId },
      {
        rating: Number(result.avgRating) || 5,
        reviewCount: Number(result.count) || 0,
      },
    );
  }
}
