import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { MilkRequirementService } from './milk-requirement.service';
import { LogProcurementBatchDto } from './dto/log-procurement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, DeliverySlot } from '@prisma/client';

@Controller('milk-requirement')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER, Role.ADMIN)
export class MilkRequirementController {
  constructor(private readonly milkRequirementService: MilkRequirementService) {}

  @Get('daily')
  async getDailyRequirement(
    @Query('date') date?: string,
    @Query('slot') slot?: DeliverySlot,
  ) {
    return this.milkRequirementService.calculateDailyRequirement(date, slot);
  }

  @Post('procure-batch')
  async logProcurementBatch(
    @Body() dto: LogProcurementBatchDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.milkRequirementService.logProcurementBatch(dto, userId);
  }
}
