import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll(params: {
    categorySlug?: string;
    search?: string;
    isFeatured?: boolean;
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  }) {
    const { categorySlug, search, isFeatured, page = 1, limit = 50, includeInactive = false } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }
    if (search && search.trim().length > 0) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { unit: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: true,
          variants: { orderBy: { price: 'asc' } },
          inventory: true,
        },
      }),
    ]);

    return {
      products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto, userId?: string) {
    const existing = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`A product with slug '${dto.slug}' already exists`);
    }

    const { variants, stock = 100, ...productData } = dto;

    const created = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          stock,
          variants: variants && variants.length > 0
            ? { create: variants }
            : undefined,
          inventory: {
            create: {
              currentStock: stock,
              reorderLevel: 20,
              dailyConsumptionRate: 0,
            },
          },
        },
        include: {
          category: true,
          variants: true,
          inventory: true,
        },
      });

      // Audit log
      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'CREATE_PRODUCT',
            entityType: 'PRODUCT',
            entityId: product.id,
            newValueJson: JSON.stringify({ name: product.name, price: product.price, stock: product.stock }),
          },
        });
      }

      return product;
    });

    return created;
  }

  async update(id: string, dto: Partial<CreateProductDto>, userId?: string) {
    const existing = await this.findById(id);

    const { variants, stock, ...updateData } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          ...updateData,
          ...(stock !== undefined ? { stock } : {}),
        },
        include: {
          category: true,
          variants: true,
          inventory: true,
        },
      });

      if (stock !== undefined) {
        await tx.inventory.upsert({
          where: { productId: id },
          update: { currentStock: stock },
          create: { productId: id, currentStock: stock, reorderLevel: 20 },
        });
      }

      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'UPDATE_PRODUCT',
            entityType: 'PRODUCT',
            entityId: id,
            oldValueJson: JSON.stringify({ name: existing.name, price: existing.price, stock: existing.stock }),
            newValueJson: JSON.stringify({ name: product.name, price: product.price, stock: product.stock }),
          },
        });
      }

      return product;
    });

    return updated;
  }

  async toggleActive(id: string, userId?: string) {
    const existing = await this.findById(id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: updated.isActive ? 'ACTIVATE_PRODUCT' : 'DEACTIVATE_PRODUCT',
          entityType: 'PRODUCT',
          entityId: id,
        },
      });
    }

    return updated;
  }
}
