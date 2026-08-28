import { IsNotEmpty, IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { AddressType } from '@prisma/client';

export class CreateAddressDto {
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @IsNotEmpty()
  @IsString()
  receiverName: string;

  @IsNotEmpty()
  @IsString()
  receiverPhone: string;

  @IsNotEmpty()
  @IsString()
  houseFlat: string;

  @IsNotEmpty()
  @IsString()
  apartmentStreet: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsNotEmpty()
  @IsString()
  area: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  pincode: string;

  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
