import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getInventoryStatus() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        inventory: true,
      },
      orderBy: { category: { sortOrder: 'asc' } },
    });

    const inventoryList = products.map((p) => {
      const currentStock = p.inventory?.currentStock ?? p.stock;
      const reorderLevel = p.inventory?.reorderLevel ?? 20;
      let status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'NORMAL';

      if (currentStock <= 0) {
        status = 'OUT_OF_STOCK';
      } else if (currentStock <= reorderLevel) {
        status = 'LOW_STOCK';
      }

      return {
        productId: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category.name,
        unit: p.unit,
        imageUrl: p.imageUrl,
        currentStock,
        reorderLevel,
        dailyConsumptionRate: p.inventory?.dailyConsumptionRate || 0,
        status,
        updatedAt: p.inventory?.updatedAt || p.updatedAt,
      };
    });

    const lowStockCount = inventoryList.filter((i) => i.status === 'LOW_STOCK').length;
    const outOfStockCount = inventoryList.filter((i) => i.status === 'OUT_OF_STOCK').length;

    return {
      summary: {
        totalProductsTracked: inventoryList.length,
        lowStockAlerts: lowStockCount,
        outOfStockAlerts: outOfStockCount,
      },
      inventory: inventoryList,
    };
  }

  async getTransactions(productId?: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const where: any = productId ? { productId } : {};

    const [total, transactions] = await Promise.all([
      this.prisma.inventoryTransaction.count({ where }),
      this.prisma.inventoryTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, unit: true } },
        },
      }),
    ]);

    return {
      transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adjustStock(dto: StockAdjustmentDto, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { inventory: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    const previousStock = product.inventory?.currentStock ?? product.stock;
    const newStock = previousStock + dto.changeQty;

    if (newStock < 0) {
      throw new BadRequestException(`Cannot adjust stock below 0. Current stock is ${previousStock}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      });

      await tx.inventory.upsert({
        where: { productId: dto.productId },
        update: { currentStock: newStock },
        create: {
          productId: dto.productId,
          currentStock: newStock,
          reorderLevel: 20,
        },
      });

      const txn = await tx.inventoryTransaction.create({
        data: {
          productId: dto.productId,
          changeQty: dto.changeQty,
          type: dto.type,
          previousStock,
          newStock,
          reasonNotes: dto.reasonNotes || `Manual adjustment by admin`,
          performedBy: userId || 'Admin',
        },
      });

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'INVENTORY_ADJUSTMENT',
            entityType: 'INVENTORY',
            entityId: dto.productId,
            oldValueJson: JSON.stringify({ stock: previousStock }),
            newValueJson: JSON.stringify({ stock: newStock, type: dto.type }),
          },
        });
      }

      return txn;
    });

    return {
      message: `Stock updated successfully for ${product.name}`,
      previousStock,
      newStock,
      transaction: result,
    };
  }
}
