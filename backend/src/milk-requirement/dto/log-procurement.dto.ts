import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class LogProcurementBatchDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  procuredUnits: number;

  @IsOptional()
  @IsNumber()
  fatPercent?: number;

  @IsOptional()
  @IsNumber()
  snfPercent?: number;

  @IsOptional()
  @IsString()
  supplierFarm?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
