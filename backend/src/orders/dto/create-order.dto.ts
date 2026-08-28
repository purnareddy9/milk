import { IsNotEmpty, IsEnum, IsArray, ValidateNested, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliverySlot, PaymentMethod, OrderStatus } from '@prisma/client';

export class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNotEmpty()
  @IsString()
  addressId: string;

  @IsNotEmpty()
  deliveryDate: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsEnum(DeliverySlot)
  deliverySlot: DeliverySlot;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  tipAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  deliveryPersonId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
