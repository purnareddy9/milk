import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(params: { entityType?: string; page?: number; limit?: number }) {
    const { entityType, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) {
      where.entityType = entityType;
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    return {
      logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
