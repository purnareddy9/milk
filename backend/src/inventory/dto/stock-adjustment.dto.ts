import { IsNotEmpty, IsNumber, IsEnum, IsString, IsOptional } from 'class-validator';
import { InventoryChangeType } from '@prisma/client';

export class StockAdjustmentDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  changeQty: number; // can be positive or negative

  @IsNotEmpty()
  @IsEnum(InventoryChangeType)
  type: InventoryChangeType;

  @IsOptional()
  @IsString()
  reasonNotes?: string;
}
