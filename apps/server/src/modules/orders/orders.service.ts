import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Order } from './entities/order.entity';
import { OrderPayment } from './entities/order-payment.entity';
import { TeacherSubject } from '../teachers/entities/teacher-subject.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { OrderStatus, PayStatus, AuditStatus } from '../../common/enums';
import { CreateOrderDto, ListOrdersDto, OrderActionDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderPayment) private paymentRepo: Repository<OrderPayment>,
    @InjectRepository(TeacherSubject) private subjectRepo: Repository<TeacherSubject>,
    @InjectRepository(TeacherProfile) private teacherRepo: Repository<TeacherProfile>,
    private config: ConfigService,
  ) {}

  async create(studentId: number, dto: CreateOrderDto) {
    const teacher = await this.teacherRepo.findOne({
      where: { userId: dto.teacherId, auditStatus: AuditStatus.APPROVED },
    });
    if (!teacher) throw new BadRequestException('教师不存在或未通过审核');

    const subjectPrice = await this.subjectRepo.findOne({
      where: {
        teacherId: teacher.id,
        subject: dto.subject,
        gradeLevel: dto.gradeLevel,
      },
    });
    if (!subjectPrice) throw new BadRequestException('该教师未设置此科目价格');

    const lessonFee = Number(subjectPrice.price);
    const feeRate = Number(this.config.get('SERVICE_FEE_RATE', 0.07));
    const serviceFee = Math.round(lessonFee * feeRate * 100) / 100;
    const totalAmount = lessonFee + serviceFee;

    const order = this.orderRepo.create({
      orderNo: this.generateOrderNo(),
      studentId,
      teacherId: dto.teacherId,
      subject: dto.subject,
      gradeLevel: dto.gradeLevel,
      lessonDate: dto.lessonDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      lessonFee,
      serviceFee,
      totalAmount,
      serviceFeeRate: feeRate,
      requirement: dto.requirement || null,
      status: OrderStatus.PENDING,
    });

    const saved = await this.orderRepo.save(order);
    await this.paymentRepo.save(this.paymentRepo.create({ orderId: saved.id }));

    return this.formatOrder(saved);
  }

  async list(userId: number, dto: ListOrdersDto) {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 10;
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.student', 'student')
      .leftJoinAndSelect('o.teacher', 'teacher')
      .leftJoinAndSelect('o.payment', 'payment');

    if (dto.role === 'teacher') {
      qb.where('o.teacher_id = :userId', { userId });
    } else {
      qb.where('o.student_id = :userId', { userId });
    }

    if (dto.status) {
      qb.andWhere('o.status = :status', { status: dto.status });
    }

    qb.orderBy('o.created_at', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((o) => this.formatOrder(o)),
      total,
      page,
      pageSize,
    };
  }

  async getDetail(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['student', 'teacher', 'payment'],
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.studentId !== userId && order.teacherId !== userId) {
      throw new ForbiddenException('无权查看此订单');
    }
    return this.formatOrder(order);
  }

  async confirm(userId: number, orderId: number) {
    const order = await this.getOrderForTeacher(userId, orderId);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许确认');
    }
    order.status = OrderStatus.CONFIRMED;
    await this.orderRepo.save(order);
    return this.formatOrder(order);
  }

  async reject(userId: number, orderId: number, dto: OrderActionDto) {
    const order = await this.getOrderForTeacher(userId, orderId);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许拒绝');
    }
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = dto.reason || '教师拒绝';
    await this.orderRepo.save(order);
    return this.formatOrder(order);
  }

  async start(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.teacherId !== userId) throw new ForbiddenException('仅教师可开始上课');
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('仅已确认的订单可开始上课');
    }
    order.status = OrderStatus.IN_PROGRESS;
    await this.orderRepo.save(order);
    return this.formatOrder(order);
  }

  async complete(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payment'],
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.studentId !== userId && order.teacherId !== userId) {
      throw new ForbiddenException('无权操作此订单');
    }
    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('订单状态不允许完成');
    }
    order.status = OrderStatus.COMPLETED;
    await this.orderRepo.save(order);
    return this.formatOrder(order);
  }

  async cancel(userId: number, orderId: number, dto: OrderActionDto) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.studentId !== userId) throw new ForbiddenException('仅学生可取消订单');
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestException('当前状态不可取消');
    }
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = dto.reason || '用户取消';
    await this.orderRepo.save(order);
    return this.formatOrder(order);
  }

  private async getOrderForTeacher(userId: number, orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.teacherId !== userId) throw new ForbiddenException('无权操作此订单');
    return order;
  }

  private generateOrderNo() {
    const date = new Date();
    const prefix = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `${prefix}${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }

  private formatOrder(order: Order) {
    return {
      id: order.id,
      orderNo: order.orderNo,
      studentId: order.studentId,
      teacherId: order.teacherId,
      student: order.student
        ? { id: order.student.id, nickname: order.student.nickname, avatarUrl: order.student.avatarUrl }
        : undefined,
      teacher: order.teacher
        ? { id: order.teacher.id, nickname: order.teacher.nickname, avatarUrl: order.teacher.avatarUrl }
        : undefined,
      subject: order.subject,
      gradeLevel: order.gradeLevel,
      lessonDate: order.lessonDate,
      startTime: order.startTime,
      endTime: order.endTime,
      lessonFee: Number(order.lessonFee),
      serviceFee: Number(order.serviceFee),
      totalAmount: Number(order.totalAmount),
      serviceFeeRate: Number(order.serviceFeeRate),
      status: order.status,
      requirement: order.requirement,
      cancelReason: order.cancelReason,
      payment: order.payment
        ? {
            payStatus: order.payment.payStatus,
            profitSharingStatus: order.payment.profitSharingStatus,
            paidAt: order.payment.paidAt,
          }
        : undefined,
      createdAt: order.createdAt,
    };
  }
}
