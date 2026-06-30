import { Controller, Get, Post, Put, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateOrderDto, ListOrdersDto, OrderActionDto } from './dto/order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: { id: number }, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: { id: number }, @Query() dto: ListOrdersDto) {
    return this.ordersService.list(user.id, dto);
  }

  @Get(':id')
  getDetail(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getDetail(user.id, id);
  }

  @Put(':id/confirm')
  confirm(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.confirm(user.id, id);
  }

  @Put(':id/reject')
  reject(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrderActionDto,
  ) {
    return this.ordersService.reject(user.id, id, dto);
  }

  @Put(':id/start')
  start(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.start(user.id, id);
  }

  @Put(':id/complete')
  complete(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.complete(user.id, id);
  }

  @Put(':id/cancel')
  cancel(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrderActionDto,
  ) {
    return this.ordersService.cancel(user.id, id, dto);
  }
}
