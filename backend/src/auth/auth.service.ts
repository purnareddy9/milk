import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
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
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Full name is required.');
    }
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException('Email address is required.');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }

    const email = dto.email.trim().toLowerCase();
    const rawPhone = dto.phone ? dto.phone.trim() : '';
    const phone = rawPhone ? (rawPhone.startsWith('+91') ? rawPhone : `+91 ${rawPhone.replace(/[^0-9]/g, '')}`) : '+91 98000 00000';

    // 1. Check if email already exists
    const emailExists = await this.prisma.user.findFirst({
      where: { email },
    });
    if (emailExists) {
      throw new ConflictException('An account with this email already exists.');
    }

    // 2. Check if mobile already exists
    if (rawPhone) {
      const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
      const phoneExists = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: rawPhone },
            { phone },
            ...(cleanDigits ? [{ phone: cleanDigits }] : []),
          ],
        },
      });
      if (phoneExists) {
        throw new ConflictException('An account with this mobile number already exists.');
      }
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role || Role.CUSTOMER;

    // 4. Await atomic database insert and commit
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            name: dto.name.trim(),
            email,
            phone,
            passwordHash,
            role,
            walletBalance: 100.0, // ₹100 Welcome Bonus
            customerProfile: role === Role.CUSTOMER ? {
              create: { loyaltyPoints: 50, totalSpent: 0, orderCount: 0 }
            } : undefined,
          },
          include: {
            customerProfile: true,
          },
        });

        // Add welcome bonus transaction to wallet ledger atomically
        if (role === Role.CUSTOMER) {
          await tx.walletTransaction.create({
            data: {
              userId: created.id,
              type: 'CREDIT',
              amount: 100.0,
              balanceAfter: 100.0,
              description: '🎉 Welcome Bonus credited to Milk Wallet',
              referenceType: 'WELCOME_BONUS',
            },
          });
        }

        return created;
      });

      // 5. Generate tokens ONLY after verified DB commit
      const tokens = this.generateTokens(user.id, user.email, user.role);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (err: any) {
      if (err instanceof ConflictException || err instanceof BadRequestException) {
        throw err;
      }
      if (err?.code === 'P2002') {
        const target = err?.meta?.target;
        if (Array.isArray(target) && target.includes('email')) {
          throw new ConflictException('An account with this email already exists.');
        }
        if (Array.isArray(target) && target.includes('phone')) {
          throw new ConflictException('An account with this mobile number already exists.');
        }
        throw new ConflictException('An account with this email or mobile number already exists.');
      }
      if (err?.code === 'P1001' || err?.code === 'P1017' || err?.name === 'PrismaClientInitializationError') {
        throw new ServiceUnavailableException("We couldn't create your account right now. Please try again shortly.");
      }
      console.error('Database user registration failed:', err);
      throw new InternalServerErrorException('Unable to create your account. Please try again.');
    }
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
