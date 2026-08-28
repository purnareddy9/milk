import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PersonaLoginDto, PersonaType } from './dto/persona-login.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone ? dto.phone.trim() : '';

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException('A user with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role || Role.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        phone: phone || '+91 98000 00000',
        passwordHash,
        role,
        walletBalance: 100.0, // ₹100 Welcome Bonus
        customerProfile: role === Role.CUSTOMER ? { create: { loyaltyPoints: 50, totalSpent: 0, orderCount: 0 } } : undefined,
      },
    });

    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const input = (dto.email || '').trim();
    const phoneFormatted = input.startsWith('+91') ? input : `+91 ${input}`;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: input.toLowerCase() },
          { phone: input },
          { phone: phoneFormatted },
        ],
      },
      include: {
        customerProfile: true,
        deliveryPersonProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email, mobile number or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email, mobile number or password');
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async otpLogin(phone: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${cleanPhone}`;

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone }, { phone: formattedPhone }, { phone: cleanPhone }],
      },
      include: {
        customerProfile: true,
        deliveryPersonProfile: true,
        addresses: true,
      },
    });

    if (!user) {
      const defaultEmail = `user_${cleanPhone.slice(-6)}@amritpuredairy.com`;
      user = await this.prisma.user.create({
        data: {
          name: `Customer ${cleanPhone.slice(-4)}`,
          email: defaultEmail,
          phone: formattedPhone,
          passwordHash: await bcrypt.hash('otp_authed_user', 10),
          role: Role.CUSTOMER,
          walletBalance: 100.0,
          customerProfile: { create: { loyaltyPoints: 50, totalSpent: 0, orderCount: 0 } },
        },
        include: {
          customerProfile: true,
          deliveryPersonProfile: true,
          addresses: true,
        },
      });
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async personaLogin(dto: PersonaLoginDto) {
    let email = '';
    switch (dto.persona) {
      case PersonaType.CUSTOMER_RAHUL:
        email = 'rahul.sharma@example.com';
        break;
      case PersonaType.CUSTOMER_PRIYA:
        email = 'priya.patel@example.com';
        break;
      case PersonaType.SELLER_RAMESH:
        email = 'admin@amritpuredairy.com';
        break;
      case PersonaType.DELIVERY_SURESH:
        email = 'suresh.kumar@amritpuredairy.com';
        break;
      default:
        email = 'rahul.sharma@example.com';
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        deliveryPersonProfile: true,
        addresses: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Demo persona user [${email}] not found in database. Did you run prisma seed?`);
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        deliveryPersonProfile: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'amrit_pure_dairy_jwt_super_secret_key_2026'),
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'amrit_pure_dairy_refresh_super_secret_key_2026'),
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 7 * 24 * 3600,
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
