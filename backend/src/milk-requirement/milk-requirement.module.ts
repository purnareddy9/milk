import { Module } from '@nestjs/common';
import { MilkRequirementService } from './milk-requirement.service';
import { MilkRequirementController } from './milk-requirement.controller';

@Module({
  controllers: [MilkRequirementController],
  providers: [MilkRequirementService],
  exports: [MilkRequirementService],
})
export class MilkRequirementModule {}
