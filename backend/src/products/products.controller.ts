import { Controller, Get, Post, Put, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('category') categorySlug?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.productsService.findAll({
      categorySlug,
      search,
      isFeatured: featured === 'true' ? true : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':slugOrId')
  async findOne(@Param('slugOrId') slugOrId: string) {
    // If it's a UUID or starts with 'prod_', try findById first
    if (slugOrId.startsWith('prod_') || slugOrId.length === 36) {
      try {
        return await this.productsService.findById(slugOrId);
      } catch {
        return this.productsService.findBySlug(slugOrId);
      }
    }
    return this.productsService.findBySlug(slugOrId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async create(@Body() dto: CreateProductDto, @CurrentUser('id') userId: string) {
    return this.productsService.create(dto, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.update(id, dto, userId);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  async toggleActive(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.productsService.toggleActive(id, userId);
  }
}
