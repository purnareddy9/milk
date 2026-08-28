import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get('validate')
  async validate(
    @Query('code') code: string,
    @Query('subtotal') subtotal: string,
  ) {
    return this.couponsService.validateCoupon(code, parseFloat(subtotal || '0'));
  }

  @Post('validate')
  async validatePost(@Body() body: { code: string; cartTotal?: number; subtotal?: number }) {
    const total = body.cartTotal !== undefined ? body.cartTotal : (body.subtotal || 0);
    return this.couponsService.validateCoupon(body.code, total);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async findAll() {
    return this.couponsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async create(@Body() body: any) {
    return this.couponsService.create(body);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async toggleActive(@Param('id') id: string) {
    return this.couponsService.toggleActive(id);
  }
}
