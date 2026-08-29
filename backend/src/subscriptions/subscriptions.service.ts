import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSubscriptionDto, PauseSubscriptionDto, SkipDeliveryDto, UpdateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionFrequency, SubscriptionStatus, DeliveryStatus, NotificationType } from '@prisma/client';
import { addDays, parseISO, startOfDay, isBefore, isAfter, isEqual } from 'date-fns';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSubscriptionDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Delivery address not found for this user');
    }

    const startDate = startOfDay(parseISO(dto.startDate));
    const endDate = dto.endDate ? startOfDay(parseISO(dto.endDate)) : null;
    const dailyPrice = Number(product.subscriptionPrice) * dto.quantity;

    const subscription = await this.prisma.$transaction(
      async (tx) => {
        const sub = await tx.subscription.create({
          data: {
            userId,
            productId: dto.productId,
            frequency: dto.frequency,
            customDays: dto.customDays ? JSON.stringify(dto.customDays) : null,
            quantity: dto.quantity,
            deliverySlot: dto.deliverySlot,
            startDate,
            endDate,
            status: SubscriptionStatus.ACTIVE,
            addressId: dto.addressId,
            paymentMethod: dto.paymentMethod,
            dailyPrice,
            notes: dto.notes,
          },
          include: {
            product: { include: { category: true } },
            address: true,
          },
        });

        // Generate 30 days of upcoming deliveries atomically in 1 query
        await this.generateDeliveriesForSubscription(tx, sub, 30);

        // Create notification
        await tx.notification.create({
          data: {
            userId,
            title: '🎉 Subscription Activated!',
            message: `Your ${dto.quantity}x ${product.name} subscription has been created. Next delivery starts on ${dto.startDate}.`,
            type: NotificationType.SUBSCRIPTION,
            linkUrl: `/subscriptions`,
          },
        });

        return sub;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return subscription;
  }

  async findUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { include: { category: true } },
        address: true,
        deliveries: {
          where: {
            deliveryDate: {
              gte: startOfDay(new Date()),
            },
          },
          orderBy: { deliveryDate: 'asc' },
          take: 7,
        },
      },
    });
  }

  async findOne(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const sub = await this.prisma.subscription.findFirst({
      where,
      include: {
        product: { include: { category: true } },
        address: true,
        user: { select: { id: true, name: true, phone: true, email: true } },
        deliveries: {
          orderBy: { deliveryDate: 'asc' },
          take: 30,
        },
      },
    });

    if (!sub) {
      throw new NotFoundException(`Subscription with id '${id}' not found`);
    }

    return sub;
  }

  async findAllAdmin(params: {
    status?: SubscriptionStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, subscriptions] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          product: true,
          address: true,
        },
      }),
    ]);

    // Metrics for Seller Subscriptions Dashboard
    const [activeCount, pausedCount, cancelledCount, allActive] = await Promise.all([
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.PAUSED } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.CANCELLED } }),
      this.prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        select: { dailyPrice: true, quantity: true },
      }),
    ]);

    const mrr = allActive.reduce((acc, s) => acc + (Number(s.dailyPrice) * 30), 0);
    const totalDailyQuantity = allActive.reduce((acc, s) => acc + s.quantity, 0);

    return {
      subscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      metrics: {
        activeSubscribers: activeCount,
        pausedSubscribers: pausedCount,
        cancelledSubscribers: cancelledCount,
        monthlyRecurringRevenue: mrr,
        estimatedDailyPackets: totalDailyQuantity,
      },
    };
  }

  async getCalendarFeed(userId: string, startDateStr: string, endDateStr: string) {
    const start = startOfDay(parseISO(startDateStr));
    const end = startOfDay(parseISO(endDateStr));

    const deliveries = await this.prisma.subscriptionDelivery.findMany({
      where: {
        userId,
        deliveryDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        subscription: {
          include: {
            product: true,
            address: true,
          },
        },
      },
      orderBy: { deliveryDate: 'asc' },
    });

    return deliveries;
  }

  async skipDelivery(subscriptionId: string, userId: string, dto: SkipDeliveryDto) {
    const sub = await this.findOne(subscriptionId, userId);
    const targetDate = startOfDay(parseISO(dto.deliveryDate));

    // Update or create delivery record with status SKIPPED
    const delivery = await this.prisma.subscriptionDelivery.upsert({
      where: {
        subscriptionId_deliveryDate: {
          subscriptionId,
          deliveryDate: targetDate,
        },
      },
      update: {
        status: DeliveryStatus.SKIPPED,
      },
      create: {
        subscriptionId,
        userId,
        deliveryDate: targetDate,
        quantity: sub.quantity,
        deliverySlot: sub.deliverySlot,
        status: DeliveryStatus.SKIPPED,
      },
    });

    return { message: 'Delivery skipped successfully for ' + dto.deliveryDate, delivery };
  }

  async pause(subscriptionId: string, userId: string, dto: PauseSubscriptionDto) {
    const sub = await this.findOne(subscriptionId, userId);
    const pauseStart = startOfDay(parseISO(dto.pauseStartDate));
    const pauseEnd = startOfDay(parseISO(dto.pauseEndDate));

    if (isAfter(pauseStart, pauseEnd)) {
      throw new BadRequestException('Pause start date must be before or equal to pause end date');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.PAUSED,
          pauseStartDate: pauseStart,
          pauseEndDate: pauseEnd,
        },
      });

      // Mark deliveries in that range as PAUSED
      await tx.subscriptionDelivery.updateMany({
        where: {
          subscriptionId,
          deliveryDate: {
            gte: pauseStart,
            lte: pauseEnd,
          },
          status: DeliveryStatus.SCHEDULED,
        },
        data: {
          status: DeliveryStatus.PAUSED,
        },
      });
    });

    return { message: `Subscription paused from ${dto.pauseStartDate} to ${dto.pauseEndDate}` };
  }

  async resume(subscriptionId: string, userId: string) {
    const sub = await this.findOne(subscriptionId, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          pauseStartDate: null,
          pauseEndDate: null,
        },
      });

      // Re-schedule future paused deliveries
      await tx.subscriptionDelivery.updateMany({
        where: {
          subscriptionId,
          deliveryDate: {
            gte: startOfDay(new Date()),
          },
          status: DeliveryStatus.PAUSED,
        },
        data: {
          status: DeliveryStatus.SCHEDULED,
        },
      });
    });

    return { message: 'Subscription resumed successfully!' };
  }

  async update(subscriptionId: string, userId: string, dto: UpdateSubscriptionDto) {
    const sub = await this.findOne(subscriptionId, userId);

    let dailyPrice = sub.dailyPrice;
    if (dto.quantity && dto.quantity !== sub.quantity) {
      const product = await this.prisma.product.findUnique({ where: { id: sub.productId } });
      if (product) {
        dailyPrice = (Number(product.subscriptionPrice) * dto.quantity) as any;
      }
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        quantity: dto.quantity !== undefined ? dto.quantity : sub.quantity,
        deliverySlot: dto.deliverySlot || sub.deliverySlot,
        addressId: dto.addressId || sub.addressId,
        frequency: dto.frequency || sub.frequency,
        customDays: dto.customDays ? JSON.stringify(dto.customDays) : sub.customDays,
        notes: dto.notes !== undefined ? dto.notes : sub.notes,
        dailyPrice,
      },
    });

    return updated;
  }

  async cancel(subscriptionId: string, userId: string) {
    await this.findOne(subscriptionId, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.CANCELLED },
      });

      // Cancel future scheduled deliveries
      await tx.subscriptionDelivery.updateMany({
        where: {
          subscriptionId,
          deliveryDate: {
            gt: startOfDay(new Date()),
          },
          status: DeliveryStatus.SCHEDULED,
        },
        data: {
          status: DeliveryStatus.FAILED,
          failureReason: 'Subscription cancelled by customer',
        },
      });
    });

    return { message: 'Subscription cancelled successfully' };
  }

  private async generateDeliveriesForSubscription(tx: any, sub: any, daysAhead: number = 30) {
    const startDate = startOfDay(new Date(sub.startDate));
    const now = startOfDay(new Date());
    const begin = isBefore(startDate, now) ? now : startDate;
    const customDays = sub.customDays ? JSON.parse(sub.customDays) : [];

    const deliveryRows: any[] = [];

    for (let i = 0; i < daysAhead; i++) {
      const targetDate = addDays(begin, i);
      const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][targetDate.getDay()];

      let shouldDeliver = false;
      if (sub.frequency === SubscriptionFrequency.DAILY) {
        shouldDeliver = true;
      } else if (sub.frequency === SubscriptionFrequency.ALTERNATE_DAYS) {
        const diffDays = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        shouldDeliver = diffDays % 2 === 0;
      } else if (sub.frequency === SubscriptionFrequency.WEEKDAYS) {
        shouldDeliver = ['MON', 'TUE', 'WED', 'THU', 'FRI'].includes(dayOfWeek);
      } else if (sub.frequency === SubscriptionFrequency.WEEKENDS) {
        shouldDeliver = ['SAT', 'SUN'].includes(dayOfWeek);
      } else if (sub.frequency === SubscriptionFrequency.CUSTOM_DAYS) {
        shouldDeliver = customDays.includes(dayOfWeek);
      }

      if (shouldDeliver) {
        deliveryRows.push({
          subscriptionId: sub.id,
          userId: sub.userId,
          deliveryDate: targetDate,
          quantity: sub.quantity,
          deliverySlot: sub.deliverySlot,
          status: DeliveryStatus.SCHEDULED,
        });
      }
    }

    if (deliveryRows.length > 0) {
      await tx.subscriptionDelivery.createMany({
        data: deliveryRows,
        skipDuplicates: true,
      });
    }
  }
}
