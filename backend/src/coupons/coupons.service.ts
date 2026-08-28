import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DiscountType } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateCoupon(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }

    if (coupon.validUntil && coupon.validUntil < new Date()) {
      throw new BadRequestException('This coupon code has expired');
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its maximum usage limit');
    }

    if (subtotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(`Minimum cart value of ₹${coupon.minOrderValue} required for this coupon`);
    }

    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      const rawDiscount = (subtotal * Number(coupon.discountValue)) / 100;
      discountAmount = coupon.maxDiscount ? Math.min(rawDiscount, Number(coupon.maxDiscount)) : rawDiscount;
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      description: coupon.description,
      finalTotal: Math.max(0, subtotal - discountAmount),
    };
  }

  async create(data: any) {
    return this.prisma.coupon.create({ data });
  }

  async toggleActive(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }
}
