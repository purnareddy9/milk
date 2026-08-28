import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number; // in INR

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifyRazorpayPaymentDto {
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}

export class WalletRechargeDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(50)
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
