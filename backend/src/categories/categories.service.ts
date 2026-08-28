import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: { variants: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }
}
