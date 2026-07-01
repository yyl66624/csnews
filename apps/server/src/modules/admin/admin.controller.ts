import { Controller, Get, Post, Put, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PaymentsService } from '../payments/payments.service';
import { Roles } from '../auth/decorators/auth.decorators';
import { UserRole, AuditStatus } from '../../common/enums';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private paymentsService: PaymentsService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('teachers')
  listTeachers(
    @Query('auditStatus') auditStatus?: AuditStatus,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.adminService.listTeachers(auditStatus, page, pageSize);
  }

  @Put('teachers/:id/audit')
  auditTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { approved: boolean; rejectReason?: string },
  ) {
    return this.adminService.auditTeacher(id, body.approved, body.rejectReason);
  }

  @Get('users')
  listUsers(
    @Query('role') role?: UserRole,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.adminService.listUsers(role, page, pageSize);
  }

  @Get('orders')
  listOrders(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.adminService.listOrders(status, page, pageSize);
  }

  @Post('orders/:id/refund')
  refundOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
  ) {
    return this.paymentsService.refundOrder(id, body.reason);
  }
}
