import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateRazorpayOrderDto, VerifyRazorpayPaymentDto, WalletRechargeDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-razorpay-order')
  async createRazorpayOrder(@CurrentUser('id') userId: string, @Body() dto: CreateRazorpayOrderDto) {
    return this.paymentsService.createRazorpayOrder(userId, dto);
  }

  @Post('verify-razorpay')
  async verifyRazorpayPayment(@CurrentUser('id') userId: string, @Body() dto: VerifyRazorpayPaymentDto) {
    return this.paymentsService.verifyRazorpayPayment(userId, dto);
  }

  @Post('wallet/recharge')
  async rechargeWallet(@CurrentUser('id') userId: string, @Body() dto: WalletRechargeDto) {
    return this.paymentsService.rechargeWallet(userId, dto);
  }

  @Get('wallet')
  async getUserWallet(@CurrentUser('id') userId: string) {
    return this.paymentsService.getUserWallet(userId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findAllAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
