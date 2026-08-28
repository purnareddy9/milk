import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionFrequency, SubscriptionStatus, DeliverySlot, PaymentMethod } from '@prisma/client';
import { format, addDays } from 'date-fns';

describe('SubscriptionsService 30-Day Idempotent Schedule Engine', () => {
  let service: SubscriptionsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      product: { findUnique: jest.fn() },
      address: { findFirst: jest.fn() },
      subscription: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      subscriptionDelivery: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ id: 'sd_upserted' }),
      },
      notification: { create: jest.fn() },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    service = new SubscriptionsService(mockPrisma as any);
  });

  it('should create a daily subscription and generate 30 days of deliveries via idempotent upserts', async () => {
    const tmrStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'prod_cow_1l',
      name: 'Pure Desi Cow Milk (1L)',
      price: 64,
      subscriptionPrice: 58,
      isActive: true,
      category: { slug: 'cow-milk' },
    });

    mockPrisma.address.findFirst.mockResolvedValue({
      id: 'addr_1',
      userId: 'user_1',
    });

    mockPrisma.subscription.create.mockResolvedValue({
      id: 'sub_123',
      userId: 'user_1',
      productId: 'prod_cow_1l',
      frequency: SubscriptionFrequency.DAILY,
      quantity: 1,
      deliverySlot: DeliverySlot.MORNING_5_30_7_30,
      startDate: new Date(tmrStr),
      endDate: null,
      customDays: null,
      product: { name: 'Pure Desi Cow Milk' },
    });

    const result = await service.create('user_1', {
      productId: 'prod_cow_1l',
      frequency: SubscriptionFrequency.DAILY,
      quantity: 1,
      deliverySlot: DeliverySlot.MORNING_5_30_7_30,
      startDate: tmrStr,
      addressId: 'addr_1',
      paymentMethod: PaymentMethod.WALLET,
    });

    expect(result).toBeDefined();
    // 30 scheduled deliveries created idempotently via upsert
    expect(mockPrisma.subscriptionDelivery.upsert).toHaveBeenCalledTimes(30);
  });

  it('should skip a specific delivery date and update status to SKIPPED', async () => {
    const targetDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_123',
      userId: 'user_1',
      product: { name: 'Pure Desi Cow Milk' },
      quantity: 1,
      deliverySlot: DeliverySlot.MORNING_5_30_7_30,
    });

    mockPrisma.subscriptionDelivery.upsert.mockResolvedValue({
      id: 'sd_1',
      subscriptionId: 'sub_123',
      status: 'SKIPPED',
    });

    const result = await service.skipDelivery('sub_123', 'user_1', { deliveryDate: targetDate });

    expect(result.message).toContain('skipped');
    expect(mockPrisma.subscriptionDelivery.upsert).toHaveBeenCalled();
  });

  it('should pause subscription and update delivery records', async () => {
    const startPause = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const endPause = format(addDays(new Date(), 5), 'yyyy-MM-dd');

    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub_123',
      userId: 'user_1',
      product: { name: 'Pure Desi Cow Milk' },
    });

    mockPrisma.subscription.update.mockResolvedValue({
      id: 'sub_123',
      status: SubscriptionStatus.PAUSED,
    });

    mockPrisma.subscriptionDelivery.updateMany.mockResolvedValue({ count: 5 });

    const result = await service.pause('sub_123', 'user_1', {
      pauseStartDate: startPause,
      pauseEndDate: endPause,
    });

    expect(result.message).toContain('paused');
    expect(mockPrisma.subscription.update).toHaveBeenCalled();
  });
});
