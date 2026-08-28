import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = { role: Role.CUSTOMER };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customerProfile: true,
          _count: {
            select: {
              orders: true,
              subscriptions: { where: { status: 'ACTIVE' } },
            },
          },
        },
      }),
    ]);

    return {
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatarUrl: c.avatarUrl,
        walletBalance: c.walletBalance,
        joinedAt: c.createdAt,
        totalOrders: c._count.orders,
        activeSubscriptionsCount: c._count.subscriptions,
        loyaltyPoints: c.customerProfile?.loyaltyPoints || 0,
        totalSpent: c.customerProfile?.totalSpent || 0,
        notes: c.customerProfile?.notes,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne360(customerId: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
      include: {
        customerProfile: true,
        addresses: true,
        subscriptions: {
          include: { product: true, address: true },
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          include: { items: true, address: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id '${customerId}' not found`);
    }

    const { passwordHash, ...safe } = customer;
    return safe;
  }
}
