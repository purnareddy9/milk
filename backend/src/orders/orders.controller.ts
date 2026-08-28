import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @Get('my')
  async getMyOrders(@CurrentUser('id') userId: string) {
    return this.ordersService.findUserOrders(userId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async findAllAdmin(
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('search') search?: string,
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAllAdmin({
      status,
      paymentStatus,
      search,
      date,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.role === Role.SELLER || user.role === Role.ADMIN ? undefined : user.id;
    return this.ordersService.findOne(id, userId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN, Role.DELIVERY_PERSON)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.ordersService.updateStatus(id, dto, actorId);
  }
}
