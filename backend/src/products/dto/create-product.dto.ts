import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  subscriptionPrice: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  subscriptionPrice: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsNumber()
  fatPercent?: number;

  @IsOptional()
  @IsNumber()
  snfPercent?: number;

  @IsOptional()
  @IsString()
  pasteurizationType?: string;

  @IsOptional()
  @IsNumber()
  shelfLifeDays?: number;

  @IsOptional()
  @IsString()
  storageInfo?: string;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsString()
  nutritionInfo?: string;

  @IsOptional()
  @IsBoolean()
  isOrganic?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
