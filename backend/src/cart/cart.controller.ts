import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('add')
  async addItem(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.cartService.addItem(userId, body);
  }

  @Put('items/:id')
  async updateQuantity(
    @Param('id') itemId: string,
    @CurrentUser('id') userId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItemQuantity(userId, itemId, quantity);
  }

  @Delete('items/:id')
  async removeItem(@Param('id') itemId: string, @CurrentUser('id') userId: string) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete('clear')
  async clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
