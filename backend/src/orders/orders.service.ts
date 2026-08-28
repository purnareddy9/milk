import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, PaymentMethod, NotificationType, InventoryChangeType, DiscountType } from '@prisma/client';
import { parseISO, startOfDay } from 'date-fns';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Delivery address not found');

    // Fetch products
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more selected products are unavailable');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check stock & calculate subtotal
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of dto.items) {
      const p = productMap.get(item.productId)!;
      if (p.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${p.name} (Available: ${p.stock})`);
      }
      const itemTotal = Number(p.price) * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: p.id,
        productName: p.name,
        unit: p.unit,
        quantity: item.quantity,
        unitPrice: p.price,
        totalPrice: itemTotal,
      });
    }

    // Process Coupon
    let discountAmount = 0;
    let validCouponCode = null;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase().trim() },
      });
      if (coupon && coupon.isActive && (!coupon.validUntil || coupon.validUntil > new Date())) {
        if (subtotal >= Number(coupon.minOrderValue)) {
          if (coupon.discountType === DiscountType.PERCENTAGE) {
            const rawDiscount = (subtotal * Number(coupon.discountValue)) / 100;
            discountAmount = coupon.maxDiscount ? Math.min(rawDiscount, Number(coupon.maxDiscount)) : rawDiscount;
          } else {
            discountAmount = Number(coupon.discountValue);
          }
          validCouponCode = coupon.code;
          // Increment used count
          await this.prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    const deliveryFee = subtotal > 199 ? 0 : 25.00;
    const tipAmount = dto.tipAmount || 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee + tipAmount);

    // If Wallet payment, check balance
    if (dto.paymentMethod === PaymentMethod.WALLET) {
      if (Number(user.walletBalance) < totalAmount) {
        throw new BadRequestException(
          `Insufficient Milk Wallet balance (₹${Number(user.walletBalance).toFixed(2)}). Please recharge or choose another payment method.`,
        );
      }
    }

    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const deliveryDate = startOfDay(parseISO(dto.deliveryDate));

    // Execute order creation in a database transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: dto.paymentMethod === PaymentMethod.COD ? OrderStatus.CONFIRMED : OrderStatus.CONFIRMED,
          paymentStatus: dto.paymentMethod === PaymentMethod.WALLET || dto.paymentMethod === PaymentMethod.RAZORPAY ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          deliveryDate,
          deliverySlot: dto.deliverySlot,
          addressId: dto.addressId,
          subtotal,
          deliveryFee,
          discountAmount,
          couponCode: validCouponCode,
          tipAmount,
          totalAmount,
          notes: dto.notes,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: { include: { product: true } },
          address: true,
        },
      });

      // 2. Deduct inventory & record transaction
      for (const item of dto.items) {
        const p = productMap.get(item.productId)!;
        const newStock = p.stock - item.quantity;

        await tx.product.update({
          where: { id: p.id },
          data: { stock: newStock },
        });

        await tx.inventory.upsert({
          where: { productId: p.id },
          update: { currentStock: newStock },
          create: { productId: p.id, currentStock: newStock, reorderLevel: 20 },
        });

        await tx.inventoryTransaction.create({
          data: {
            productId: p.id,
            changeQty: -item.quantity,
            type: InventoryChangeType.SALE_DEDUCTION,
            previousStock: p.stock,
            newStock,
            reasonNotes: `Sold in Order #${orderNumber}`,
          },
        });
      }

      // 3. Handle Wallet deduction if applicable
      if (dto.paymentMethod === PaymentMethod.WALLET) {
        const newBalance = Number(user.walletBalance) - totalAmount;
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: newBalance },
        });

        await tx.walletTransaction.create({
          data: {
            userId,
            type: 'DEBIT',
            amount: totalAmount,
            balanceAfter: newBalance,
            description: `Payment for Order #${orderNumber}`,
            referenceType: 'ORDER',
            referenceId: newOrder.id,
          },
        });
      }

      // 4. Update Customer Profile statistics
      await tx.customerProfile.upsert({
        where: { userId },
        update: {
          totalSpent: { increment: totalAmount },
          orderCount: { increment: 1 },
          loyaltyPoints: { increment: Math.floor(totalAmount / 10) },
        },
        create: {
          userId,
          totalSpent: totalAmount,
          orderCount: 1,
          loyaltyPoints: Math.floor(totalAmount / 10),
        },
      });

      // 5. Create In-App Notification
      await tx.notification.create({
        data: {
          userId,
          title: `🥛 Order Placed #${orderNumber}`,
          message: `Your order for ₹${totalAmount.toFixed(2)} has been placed successfully. Delivery: ${dto.deliveryDate}.`,
          type: NotificationType.ORDER,
          linkUrl: `/orders/${newOrder.id}`,
        },
      });

      return newOrder;
    });

    return order;
  }

  async findUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    });
  }

  async findOne(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: { include: { product: true } },
        address: true,
        deliveryPerson: { include: { user: true } },
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id '${id}' not found`);
    }

    return order;
  }

  async findAllAdmin(params: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, paymentStatus, search, date, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (date) where.deliveryDate = startOfDay(parseISO(date));
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          items: { include: { product: true } },
          address: true,
          deliveryPerson: { include: { user: true } },
        },
      }),
    ]);

    // Fast status summary counts for admin tabs
    const [pendingCount, preparingCount, outForDeliveryCount, deliveredCount, cancelledCount] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.PREPARING } }),
      this.prisma.order.count({ where: { status: OrderStatus.OUT_FOR_DELIVERY } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    return {
      orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        pending: pendingCount,
        preparing: preparingCount,
        outForDelivery: outForDeliveryCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
      },
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actorId?: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        deliveryPersonId: dto.deliveryPersonId || existing.deliveryPersonId,
        paymentStatus: dto.status === OrderStatus.DELIVERED && existing.paymentMethod === PaymentMethod.COD ? PaymentStatus.PAID : existing.paymentStatus,
      },
      include: {
        user: true,
      },
    });

    // Notify customer about status update
    let message = '';
    if (dto.status === OrderStatus.PREPARING) {
      message = 'Your dairy products are being freshly packed at the dairy.';
    } else if (dto.status === OrderStatus.OUT_FOR_DELIVERY) {
      message = 'Your order is out for delivery! The delivery partner is on the way.';
    } else if (dto.status === OrderStatus.DELIVERED) {
      message = 'Your order has been delivered! Enjoy your fresh dairy products.';
    }

    if (message) {
      await this.prisma.notification.create({
        data: {
          userId: existing.userId,
          title: `🚚 Order #${existing.orderNumber} ${dto.status.replace('_', ' ')}`,
          message,
          type: NotificationType.DELIVERY,
          linkUrl: `/orders/${id}`,
        },
      });
    }

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: 'UPDATE_ORDER_STATUS',
          entityType: 'ORDER',
          entityId: id,
          oldValueJson: JSON.stringify({ status: existing.status }),
          newValueJson: JSON.stringify({ status: dto.status }),
        },
      });
    }

    return updated;
  }
}
