import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER, Role.ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('status')
  async getInventoryStatus() {
    return this.inventoryService.getInventoryStatus();
  }

  @Get('transactions')
  async getTransactions(
    @Query('productId') productId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getTransactions(
      productId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('adjust')
  async adjustStock(
    @Body() dto: StockAdjustmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.adjustStock(dto, userId);
  }
}
