import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('addresses')
  async getAddresses(@CurrentUser('id') userId: string) {
    return this.usersService.getUserAddresses(userId);
  }

  @Post('addresses')
  async addAddress(@CurrentUser('id') userId: string, @Body() dto: CreateAddressDto) {
    return this.usersService.addAddress(userId, dto);
  }

  @Put('addresses/:id')
  async updateAddress(
    @Param('id') addressId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateAddressDto>,
  ) {
    return this.usersService.updateAddress(userId, addressId, dto);
  }

  @Delete('addresses/:id')
  async deleteAddress(@Param('id') addressId: string, @CurrentUser('id') userId: string) {
    return this.usersService.deleteAddress(userId, addressId);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; phone?: string; avatarUrl?: string },
  ) {
    return this.usersService.updateProfile(userId, body);
  }
}
