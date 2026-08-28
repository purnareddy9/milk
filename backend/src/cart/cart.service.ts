import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubscriptionFrequency } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: { include: { category: true } },
            },
          },
        },
      });
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.isSubscription ? Number(item.product.subscriptionPrice) : Number(item.product.price);
      return sum + price * item.quantity;
    }, 0);

    return {
      id: cart.id,
      items: cart.items,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee: subtotal > 199 || subtotal === 0 ? 0 : 25,
      estimatedTotal: parseFloat((subtotal > 0 ? subtotal + (subtotal > 199 ? 0 : 25) : 0).toFixed(2)),
    };
  }

  async addItem(
    userId: string,
    data: {
      productId: string;
      quantity?: number;
      isSubscription?: boolean;
      frequency?: SubscriptionFrequency;
      customDays?: string[];
    },
  ) {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not available');
    }

    const quantityToAdd = data.quantity || 1;

    // Check if item already in cart
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: data.productId,
        isSubscription: data.isSubscription || false,
      },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantityToAdd },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          quantity: quantityToAdd,
          isSubscription: data.isSubscription || false,
          frequency: data.frequency,
          customDays: data.customDays ? JSON.stringify(data.customDays) : null,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(userId, itemId);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { message: 'Cart cleared successfully' };
  }
}
