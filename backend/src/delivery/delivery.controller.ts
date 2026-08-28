import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, DeliverySlot, DeliveryStatus } from '@prisma/client';

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async getDeliveryDashboard(
    @Query('date') date?: string,
    @Query('slot') slot?: DeliverySlot,
  ) {
    return this.deliveryService.getDeliveryDashboard(date, slot);
  }

  @Get('run-sheet')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY_PERSON, Role.SELLER, Role.ADMIN)
  async getRunSheet(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    return this.deliveryService.getDeliveryPartnerRunSheet(userId, date);
  }

  @Get('partner/run-sheet')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY_PERSON, Role.SELLER, Role.ADMIN)
  async getPartnerRunSheet(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    return this.deliveryService.getDeliveryPartnerRunSheet(userId, date);
  }

  @Patch('subscription-delivery/:id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.DELIVERY_PERSON, Role.SELLER, Role.ADMIN)
  async updateSubscriptionDeliveryStatus(
    @Param('id') id: string,
    @Body('status') status: DeliveryStatus,
    @Body('failureReason') failureReason?: string,
  ) {
    return this.deliveryService.updateSubscriptionDeliveryStatus(id, status, failureReason);
  }

  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async assignDelivery(
    @Body('type') type: 'SUBSCRIPTION' | 'ORDER',
    @Body('id') id: string,
    @Body('deliveryPersonId') deliveryPersonId: string,
  ) {
    return this.deliveryService.assignDeliveryPerson(type, id, deliveryPersonId);
  }
}
