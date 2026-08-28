import { IsNotEmpty, IsEnum, IsNumber, IsOptional, IsString, IsArray, Min } from 'class-validator';
import { SubscriptionFrequency, DeliverySlot, PaymentMethod } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsEnum(SubscriptionFrequency)
  frequency: SubscriptionFrequency;

  @IsOptional()
  @IsArray()
  customDays?: string[];

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsEnum(DeliverySlot)
  deliverySlot: DeliverySlot;

  @IsNotEmpty()
  startDate: string; // YYYY-MM-DD

  @IsOptional()
  endDate?: string;

  @IsNotEmpty()
  @IsString()
  addressId: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PauseSubscriptionDto {
  @IsNotEmpty()
  pauseStartDate: string; // YYYY-MM-DD

  @IsNotEmpty()
  pauseEndDate: string; // YYYY-MM-DD
}

export class SkipDeliveryDto {
  @IsNotEmpty()
  deliveryDate: string; // YYYY-MM-DD
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsEnum(DeliverySlot)
  deliverySlot?: DeliverySlot;

  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsEnum(SubscriptionFrequency)
  frequency?: SubscriptionFrequency;

  @IsOptional()
  @IsArray()
  customDays?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
