import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsNotEmpty({ message: 'Full name is required' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
