import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const count = await this.prisma.address.count({ where: { userId } });
    const isFirst = count === 0;

    return this.prisma.address.create({
      data: {
        ...dto,
        userId,
        isDefault: dto.isDefault || isFirst,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: Partial<CreateAddressDto>) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new NotFoundException('Address not found');

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        walletBalance: true,
      },
    });
  }
}
