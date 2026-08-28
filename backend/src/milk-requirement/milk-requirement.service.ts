import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LogProcurementBatchDto } from './dto/log-procurement.dto';
import { DeliverySlot, DeliveryStatus, InventoryChangeType, OrderStatus } from '@prisma/client';
import { parseISO, startOfDay } from 'date-fns';

export interface ProductRequirement {
  productId: string;
  productName: string;
  categorySlug: string;
  unit: string;
  imageUrl: string;
  subscriptionUnits: number;
  instantOrderUnits: number;
  totalUnitsRequired: number;
  totalVolumeLitersOrKg: number;
  currentStock: number;
  surplusOrDeficit: number; // positive = surplus, negative = shortage
  status: 'SUFFICIENT' | 'LOW' | 'SHORTAGE';
}

@Injectable()
export class MilkRequirementService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateDailyRequirement(targetDateStr?: string, slot?: DeliverySlot) {
    const targetDate = targetDateStr ? startOfDay(parseISO(targetDateStr)) : startOfDay(new Date());

    // 1. Fetch all subscription deliveries scheduled or delivered for targetDate
    const subDeliveriesWhere: any = {
      deliveryDate: targetDate,
      status: {
        in: [DeliveryStatus.SCHEDULED, DeliveryStatus.PREPARING, DeliveryStatus.DISPATCHED, DeliveryStatus.DELIVERED],
      },
    };
    if (slot) {
      subDeliveriesWhere.deliverySlot = slot;
    }

    const subDeliveries = await this.prisma.subscriptionDelivery.findMany({
      where: subDeliveriesWhere,
      include: {
        subscription: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
    });

    // 2. Fetch all instant orders scheduled for targetDate
    const ordersWhere: any = {
      deliveryDate: targetDate,
      status: {
        in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
      },
    };
    if (slot) {
      ordersWhere.deliverySlot = slot;
    }

    const instantOrders = await this.prisma.order.findMany({
      where: ordersWhere,
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
    });

    // 3. Fetch all active products and inventory
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        inventory: true,
      },
      orderBy: { category: { sortOrder: 'asc' } },
    });

    // 4. Map requirements by product ID
    const requirementMap = new Map<string, { subUnits: number; orderUnits: number }>();
    for (const p of products) {
      requirementMap.set(p.id, { subUnits: 0, orderUnits: 0 });
    }

    // Accumulate subscription units
    for (const sd of subDeliveries) {
      const pId = (sd as any).subscription?.productId || (sd as any).productId;
      if (!pId) continue;
      const current = requirementMap.get(pId) || { subUnits: 0, orderUnits: 0 };
      current.subUnits += sd.quantity;
      requirementMap.set(pId, current);
    }

    // Accumulate instant order units
    for (const ord of instantOrders) {
      for (const item of (ord.items || [])) {
        const pId = item?.productId;
        if (!pId) continue;
        const current = requirementMap.get(pId) || { subUnits: 0, orderUnits: 0 };
        current.orderUnits += (item.quantity || 0);
        requirementMap.set(pId, current);
      }
    }

    // 5. Build rich requirement objects
    let totalLitersRequired = 0;
    let totalLitersAvailable = 0;
    let totalSubscriptionDeliveriesCount = subDeliveries.length;
    let totalInstantOrdersCount = instantOrders.length;

    const breakdown: ProductRequirement[] = [];

    for (const product of products) {
      const counts = requirementMap.get(product.id) || { subUnits: 0, orderUnits: 0 };
      const totalUnits = counts.subUnits + counts.orderUnits;
      const currentStock = product.inventory?.currentStock || product.stock || 0;

      // Calculate approximate volume in Liters or Kg
      let unitVolumeFactor = 1.0;
      const unitLower = (product.unit || '1L').toLowerCase();
      if (unitLower.includes('500ml')) unitVolumeFactor = 0.5;
      else if (unitLower.includes('250ml') || unitLower.includes('300ml')) unitVolumeFactor = 0.3;
      else if (unitLower.includes('1l') || unitLower.includes('1 l')) unitVolumeFactor = 1.0;
      else if (unitLower.includes('2l')) unitVolumeFactor = 2.0;
      else if (unitLower.includes('5l')) unitVolumeFactor = 5.0;
      else if (unitLower.includes('200g')) unitVolumeFactor = 0.2;
      else if (unitLower.includes('400g') || unitLower.includes('500g')) unitVolumeFactor = 0.5;
      else if (unitLower.includes('1kg')) unitVolumeFactor = 1.0;

      const totalVolume = totalUnits * unitVolumeFactor;
      const stockVolume = currentStock * unitVolumeFactor;
      const surplusOrDeficit = currentStock - totalUnits;

      let status: 'SUFFICIENT' | 'LOW' | 'SHORTAGE' = 'SUFFICIENT';
      if (surplusOrDeficit < 0) {
        status = 'SHORTAGE';
      } else if (surplusOrDeficit < 10) {
        status = 'LOW';
      }

      const catSlug = product.category?.slug || '';
      if (catSlug.includes('milk') || catSlug.includes('buttermilk')) {
        totalLitersRequired += totalVolume;
        totalLitersAvailable += stockVolume;
      }

      breakdown.push({
        productId: product.id,
        productName: product.name,
        categorySlug: catSlug || 'dairy',
        unit: product.unit,
        imageUrl: product.imageUrl,
        subscriptionUnits: counts.subUnits,
        instantOrderUnits: counts.orderUnits,
        totalUnitsRequired: totalUnits,
        totalVolumeLitersOrKg: parseFloat(totalVolume.toFixed(1)),
        currentStock,
        surplusOrDeficit,
        status,
      });
    }

    const netSurplusOrDeficitLiters = parseFloat((totalLitersAvailable - totalLitersRequired).toFixed(1));

    return {
      date: targetDate.toISOString().split('T')[0],
      slot: slot || 'ALL_SLOTS',
      summary: {
        totalMilkLitersRequired: parseFloat(totalLitersRequired.toFixed(1)),
        totalMilkLitersAvailable: parseFloat(totalLitersAvailable.toFixed(1)),
        netSurplusOrDeficitLiters,
        overallStatus: netSurplusOrDeficitLiters < 0 ? 'DEFICIT_WARNING' : 'SUFFICIENT_STOCK',
        totalSubscriptionsServing: totalSubscriptionDeliveriesCount,
        totalInstantOrdersServing: totalInstantOrdersCount,
        totalDeliveryStops: totalSubscriptionDeliveriesCount + totalInstantOrdersCount,
      },
      productBreakdown: breakdown,
    };
  }

  async logProcurementBatch(dto: LogProcurementBatchDto, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { inventory: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const previousStock = product.inventory?.currentStock || product.stock;
    const newStock = previousStock + dto.procuredUnits;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update Product stock
      await tx.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      });

      // 2. Update or create Inventory record
      await tx.inventory.upsert({
        where: { productId: dto.productId },
        update: { currentStock: newStock },
        create: {
          productId: dto.productId,
          currentStock: newStock,
          reorderLevel: 20,
        },
      });

      // 3. Record Inventory Transaction
      const txn = await tx.inventoryTransaction.create({
        data: {
          productId: dto.productId,
          changeQty: dto.procuredUnits,
          type: InventoryChangeType.PROCUREMENT_BATCH,
          previousStock,
          newStock,
          reasonNotes: `Procurement batch: ${dto.supplierFarm || 'Farm Supplier'} (${dto.batchNumber || 'Batch #' + Date.now().toString().slice(-6)}). Fat: ${dto.fatPercent || product.fatPercent}%, SNF: ${dto.snfPercent || product.snfPercent}%. ${dto.notes || ''}`,
          performedBy: userId || 'Dairy Manager',
        },
      });

      // 4. Record Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'LOG_PROCUREMENT_BATCH',
          entityType: 'INVENTORY',
          entityId: dto.productId,
          newValueJson: JSON.stringify({
            procuredUnits: dto.procuredUnits,
            newStock,
            farm: dto.supplierFarm,
            fat: dto.fatPercent,
          }),
        },
      });

      return txn;
    });

    return {
      message: `Successfully logged procurement batch of ${dto.procuredUnits} units for ${product.name}`,
      previousStock,
      newStock,
      transaction: result,
    };
  }
}
