import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationType, Role } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    const [unreadCount, notifications] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    return {
      unreadCount,
      notifications,
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async broadcastNotification(title: string, message: string, type: NotificationType = NotificationType.SYSTEM) {
    const customers = await this.prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      select: { id: true },
    });

    const notificationsData = customers.map((c) => ({
      userId: c.id,
      title,
      message,
      type,
      isRead: false,
    }));

    return this.prisma.notification.createMany({
      data: notificationsData,
    });
  }
}
