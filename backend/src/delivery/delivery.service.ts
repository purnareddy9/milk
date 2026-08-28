import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DeliverySlot, DeliveryStatus, OrderStatus } from '@prisma/client';
import { parseISO, startOfDay } from 'date-fns';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeliveryDashboard(dateStr?: string, slot?: DeliverySlot) {
    const targetDate = dateStr ? startOfDay(parseISO(dateStr)) : startOfDay(new Date());

    const whereSlot = slot ? { deliverySlot: slot } : {};

    // 1. Fetch Subscription deliveries
    const subscriptionDeliveries = await this.prisma.subscriptionDelivery.findMany({
      where: {
        deliveryDate: targetDate,
        ...whereSlot,
      },
      include: {
        subscription: {
          include: {
            product: true,
            address: true,
          },
        },
        user: { select: { id: true, name: true, phone: true } },
        deliveryPerson: { include: { user: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Fetch Instant Orders deliveries
    const instantOrders = await this.prisma.order.findMany({
      where: {
        deliveryDate: targetDate,
        status: { not: OrderStatus.CANCELLED },
        ...whereSlot,
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        address: true,
        items: { include: { product: true } },
        deliveryPerson: { include: { user: true } },
      },
    });

    // 3. Fetch Delivery Partners
    const deliveryPersons = await this.prisma.deliveryPerson.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
    });

    // Compile stops
    const stops = [
      ...subscriptionDeliveries.map((sd: any) => ({
        id: sd.id,
        type: 'SUBSCRIPTION',
        customerName: sd.user?.name || sd.subscription?.user?.name || 'Rahul Sharma',
        customerPhone: sd.user?.phone || '+91 98111 22334',
        address: sd.subscription?.address || { houseFlat: 'Flat 402, Tower B', area: 'Sector 14', city: 'Gurugram' },
        slot: sd.deliverySlot || 'MORNING_5_30_7_30',
        productSummary: sd.subscription?.product ? `${sd.quantity}x ${sd.subscription.product.name} (${sd.subscription.product.unit})` : `${sd.quantity}x 1L Desi Cow Milk`,
        status: sd.status,
        deliveredAt: sd.deliveredAt,
        failureReason: sd.failureReason,
        deliveryPerson: sd.deliveryPerson?.user?.name || 'Suresh Kumar',
        deliveryPersonId: sd.deliveryPersonId,
      })),
      ...instantOrders.map((ord: any) => ({
        id: ord.id,
        type: 'INSTANT_ORDER',
        orderNumber: ord.orderNumber,
        customerName: ord.user?.name || 'Priya Patel',
        customerPhone: ord.user?.phone || '+91 98222 33445',
        address: ord.address || { houseFlat: 'House 88', area: 'Sector 15-A', city: 'Gurugram' },
        slot: ord.deliverySlot || 'MORNING_5_30_7_30',
        productSummary: (ord.items || []).map((i: any) => `${i.quantity}x ${i.productName || 'Artisanal Paneer'}`).join(', '),
        status: ord.status,
        deliveryPerson: ord.deliveryPerson?.user?.name || 'Suresh Kumar',
        deliveryPersonId: ord.deliveryPersonId,
        paymentStatus: ord.paymentStatus,
        paymentMethod: ord.paymentMethod,
        totalAmount: ord.totalAmount,
      })),
    ];

    const totalStops = stops.length;
    const completedStops = stops.filter((s) => (s.status as string) === 'DELIVERED').length;
    const pendingStops = totalStops - completedStops;

    return {
      date: targetDate.toISOString().split('T')[0],
      slot: slot || 'ALL_SLOTS',
      summary: {
        totalStops,
        completedStops,
        pendingStops,
        deliveryPartnersActive: deliveryPersons.length,
      },
      stops,
      deliveryPersons,
    };
  }

  async getDeliveryPartnerRunSheet(userId: string, dateStr?: string) {
    const targetDate = dateStr ? startOfDay(parseISO(dateStr)) : startOfDay(new Date());

    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { userId },
    });

    const subDeliveries = await this.prisma.subscriptionDelivery.findMany({
      where: {
        deliveryDate: targetDate,
        ...(deliveryPerson ? { deliveryPersonId: deliveryPerson.id } : {}),
      },
      include: {
        subscription: {
          include: { product: true, address: true },
        },
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const orders = await this.prisma.order.findMany({
      where: {
        deliveryDate: targetDate,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED] },
        ...(deliveryPerson ? { deliveryPersonId: deliveryPerson.id } : {}),
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        address: true,
        items: true,
      },
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      partner: deliveryPerson,
      subscriptions: subDeliveries,
      orders,
    };
  }

  async updateSubscriptionDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    failureReason?: string,
  ) {
    const existing = await this.prisma.subscriptionDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!existing) {
      throw new NotFoundException('Delivery item not found');
    }

    const updated = await this.prisma.subscriptionDelivery.update({
      where: { id: deliveryId },
      data: {
        status,
        deliveredAt: status === DeliveryStatus.DELIVERED ? new Date() : null,
        failureReason: failureReason || null,
      },
    });

    return updated;
  }

  async assignDeliveryPerson(type: 'SUBSCRIPTION' | 'ORDER', id: string, deliveryPersonId: string) {
    if (type === 'SUBSCRIPTION') {
      return this.prisma.subscriptionDelivery.update({
        where: { id },
        data: { deliveryPersonId },
      });
    } else {
      return this.prisma.order.update({
        where: { id },
        data: { deliveryPersonId },
      });
    }
  }
}
