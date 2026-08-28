import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, PauseSubscriptionDto, SkipDeliveryDto, UpdateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, SubscriptionStatus } from '@prisma/client';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(userId, dto);
  }

  @Get()
  async getAllMySubscriptions(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.findUserSubscriptions(userId);
  }

  @Get('my')
  async getMySubscriptions(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.findUserSubscriptions(userId);
  }

  @Get('calendar')
  async getCalendarFeed(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate || new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const end = endDate || d.toISOString().split('T')[0];
    return this.subscriptionsService.getCalendarFeed(userId, start, end);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async findAllAdmin(
    @Query('status') status?: SubscriptionStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionsService.findAllAdmin({
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.role === Role.SELLER || user.role === Role.ADMIN ? undefined : user.id;
    return this.subscriptionsService.findOne(id, userId);
  }

  @Post(':id/skip')
  async skipDelivery(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SkipDeliveryDto,
  ) {
    return this.subscriptionsService.skipDelivery(id, userId, dto);
  }

  @Post(':id/pause')
  async pause(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: PauseSubscriptionDto,
  ) {
    return this.subscriptionsService.pause(id, userId, dto);
  }

  @Post(':id/resume')
  async resume(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.subscriptionsService.resume(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, userId, dto);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.subscriptionsService.cancel(id, userId);
  }
}
