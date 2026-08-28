import { MilkRequirementService } from './milk-requirement.service';
import { format } from 'date-fns';

describe('MilkRequirementService Volume Calculations', () => {
  let service: MilkRequirementService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      subscriptionDelivery: { findMany: jest.fn() },
      order: { findMany: jest.fn() },
      inventory: { findMany: jest.fn(), upsert: jest.fn() },
      inventoryTransaction: { create: jest.fn() },
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'prod_cow_1l' }),
      },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    service = new MilkRequirementService(mockPrisma as any);
  });

  it('should accurately calculate morning milk demand across subscriptions and instant orders', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 'prod_cow_1l',
        name: 'Pure Desi Cow Milk (1L Glass Bottle)',
        unit: '1L',
        stock: 30,
        inventory: { currentStock: 30, lowStockThreshold: 10 },
        category: { slug: 'cow-milk', name: 'Cow Milk' },
        imageUrl: 'https://example.com/cow.jpg',
      },
      {
        id: 'prod_cow_500ml',
        name: 'Farm Fresh Cow Milk (500ml)',
        unit: '500ml',
        stock: 2,
        inventory: { currentStock: 2, lowStockThreshold: 5 },
        category: { slug: 'cow-milk', name: 'Cow Milk' },
        imageUrl: 'https://example.com/cow500.jpg',
      },
    ]);

    mockPrisma.subscriptionDelivery.findMany.mockResolvedValue([
      {
        id: 'sd1',
        quantity: 10,
        subscription: {
          productId: 'prod_cow_1l',
          deliverySlot: 'MORNING_5_30_7_30',
          product: {
            id: 'prod_cow_1l',
            name: 'Pure Desi Cow Milk (1L Glass Bottle)',
            unit: '1L',
            category: { slug: 'cow-milk' },
            imageUrl: 'https://example.com/cow.jpg',
          },
        },
      },
    ]);

    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: 'ord1',
        items: [
          {
            productId: 'prod_cow_500ml',
            quantity: 5,
            product: {
              id: 'prod_cow_500ml',
              name: 'Farm Fresh Cow Milk (500ml)',
              unit: '500ml',
              category: { slug: 'cow-milk' },
              imageUrl: 'https://example.com/cow500.jpg',
            },
          },
        ],
      },
    ]);

    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const result = await service.calculateDailyRequirement(dateStr, 'MORNING_5_30_7_30' as any);

    expect(result).toBeDefined();
    // 10L from subscriptions + 2.5L from instant orders = 12.5L total volume
    expect(result.summary.totalMilkLitersRequired).toBe(12.5);
    expect(result.summary.totalSubscriptionsServing).toBe(1);
    expect(result.summary.totalInstantOrdersServing).toBe(1);
    expect(result.productBreakdown.length).toBe(2);

    const cow1L = result.productBreakdown.find((p) => p.productId === 'prod_cow_1l');
    expect(cow1L?.totalVolumeLitersOrKg).toBe(10);
    expect(cow1L?.status).toBe('SUFFICIENT');

    const cow500 = result.productBreakdown.find((p) => p.productId === 'prod_cow_500ml');
    expect(cow500?.totalVolumeLitersOrKg).toBe(2.5);
    // Needed 5, stock 2 => shortage of -3
    expect(cow500?.surplusOrDeficit).toBe(-3);
    expect(cow500?.status).toBe('SHORTAGE');
  });

  it('should correctly log a farm procurement batch and update inventory', async () => {
    mockPrisma.inventory.upsert.mockResolvedValue({
      productId: 'prod_cow_1l',
      quantity: 120,
    });
    mockPrisma.inventoryTransaction.create.mockResolvedValue({ id: 'txn_1' });
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit_1' });
    mockPrisma.product.findUnique.mockResolvedValue({ name: 'Pure Desi Cow Milk', stock: 20 });

    const result = await service.logProcurementBatch({
      productId: 'prod_cow_1l',
      procuredUnits: 100,
      supplierFarm: 'Amrit Organic Heritage Farm #2',
      fatPercent: 4.5,
      snfPercent: 8.8,
      notes: 'Morning milking batch',
    });

    expect(result.message).toBeDefined();
    expect(result.newStock).toBe(120);
    expect(mockPrisma.inventory.upsert).toHaveBeenCalled();
    expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalled();
  });
});
