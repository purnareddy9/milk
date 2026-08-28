import * as bcrypt from 'bcryptjs';

export interface InMemoryStore {
  users: any[];
  customerProfiles: any[];
  deliveryPersons: any[];
  categories: any[];
  products: any[];
  productVariants: any[];
  addresses: any[];
  carts: any[];
  cartItems: any[];
  subscriptions: any[];
  subscriptionDeliveries: any[];
  orders: any[];
  orderItems: any[];
  payments: any[];
  walletTransactions: any[];
  deliveryRuns: any[];
  inventories: any[];
  inventoryTransactions: any[];
  coupons: any[];
  notifications: any[];
  auditLogs: any[];
}

export function createInitialSeedData(): InMemoryStore {
  const passwordHash = bcrypt.hashSync('password123', 10);

  const users = [
    {
      id: 'usr_seller_001',
      name: 'Ramesh Patel',
      email: 'admin@amritpuredairy.com',
      phone: '+91 98765 43210',
      passwordHash,
      role: 'SELLER',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      walletBalance: 25000.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr_cust_001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 98111 22334',
      passwordHash,
      role: 'CUSTOMER',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      walletBalance: 1450.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr_cust_002',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+91 98222 33445',
      passwordHash,
      role: 'CUSTOMER',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      walletBalance: 850.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr_deliv_001',
      name: 'Suresh Kumar',
      email: 'suresh.kumar@amritpuredairy.com',
      phone: '+91 98333 44556',
      passwordHash,
      role: 'DELIVERY_PERSON',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      walletBalance: 500.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const customerProfiles = [
    {
      id: 'cp_001',
      userId: 'usr_cust_001',
      loyaltyPoints: 340,
      totalSpent: 4850.0,
      orderCount: 18,
      notes: 'Subscribed to Daily Cow Milk. Prefers glass bottles left in milk bag.',
    },
    {
      id: 'cp_002',
      userId: 'usr_cust_002',
      loyaltyPoints: 180,
      totalSpent: 2950.0,
      orderCount: 9,
      notes: 'Alternate days Buffalo Milk & weekly Paneer enthusiast.',
    },
  ];

  const deliveryPersons = [
    {
      id: 'dp_001',
      userId: 'usr_deliv_001',
      vehicleType: 'Two-Wheeler (EV Scooter)',
      vehicleNumber: 'HR-26-DM-4412',
      currentRoute: 'Sector 14 & 15 Morning Route',
      isAvailable: true,
      activeDeliveriesCount: 4,
    },
  ];

  const categories = [
    {
      id: 'cat_001',
      name: 'Pure Cow Milk',
      slug: 'cow-milk',
      description: '100% pure, farm-fresh cow milk with natural nutrients and beta-casein proteins.',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 'cat_002',
      name: 'Full Cream Buffalo Milk',
      slug: 'buffalo-milk',
      description: 'Rich, thick buffalo milk with 6.5%+ natural fat for luscious tea, coffee, and sweets.',
      imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=600&auto=format&fit=crop&q=80',
      sortOrder: 2,
      isActive: true,
    },
    {
      id: 'cat_003',
      name: 'Vedic A2 Gir Cow Milk',
      slug: 'a2-milk',
      description: 'Certified A2 beta-casein milk from indigenous Desi Gir cows. Easy digestion & high immunity.',
      imageUrl: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=600&auto=format&fit=crop&q=80',
      sortOrder: 3,
      isActive: true,
    },
    {
      id: 'cat_004',
      name: 'Artisanal Malai Paneer',
      slug: 'paneer',
      description: 'Soft, melt-in-mouth cottage cheese crafted from whole milk without starches or chemicals.',
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      sortOrder: 4,
      isActive: true,
    },
    {
      id: 'cat_005',
      name: 'Vedic Bilona Ghee',
      slug: 'ghee',
      description: 'Traditional curd-churned golden bilona cow ghee loaded with medicinal aroma.',
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
      sortOrder: 5,
      isActive: true,
    },
    {
      id: 'cat_006',
      name: 'Thick Farm Curd (Dahi)',
      slug: 'curd',
      description: 'Naturally fermented thick probiotic curd with live beneficial cultures.',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
      sortOrder: 6,
      isActive: true,
    },
    {
      id: 'cat_007',
      name: 'Masala Chaas & Buttermilk',
      slug: 'buttermilk',
      description: 'Refreshing spiced buttermilk infused with roasted cumin, rock salt, and fresh mint.',
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
      sortOrder: 7,
      isActive: true,
    },
  ];

  const products = [
    {
      id: 'prod_cow_1l',
      name: 'Pure Desi Cow Milk (1L Glass Bottle)',
      slug: 'pure-desi-cow-milk-1l',
      categoryId: 'cat_001',
      price: 64.0,
      subscriptionPrice: 58.0,
      unit: '1L',
      shelfLifeDays: 3,
      fatPercent: 4.5,
      snfPercent: 8.5,
      isOrganic: true,
      isFeatured: true,
      stock: 150,
      imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=800&auto=format&fit=crop&q=80',
      description: 'Pasteurized non-homogenized pure cow milk from grass-fed cows. Bottled in eco-friendly glass bottles.',
      storageInfo: 'Store refrigerated between 2°C to 4°C. Consume within 72 hours of unsealing.',
      nutritionInfo: '{"calories":"62 kcal","protein":"3.2g","fat":"4.5g","calcium":"120mg","carbohydrates":"4.7g"}',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod_cow_500ml',
      name: 'Farm Fresh Cow Milk (500ml)',
      slug: 'farm-fresh-cow-milk-500ml',
      categoryId: 'cat_001',
      price: 33.0,
      subscriptionPrice: 30.0,
      unit: '500ml',
      shelfLifeDays: 3,
      fatPercent: 4.5,
      snfPercent: 8.5,
      isOrganic: true,
      isFeatured: false,
      stock: 90,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
      description: 'Convenient 500ml pack of daily fresh cow milk for small families and morning coffee.',
      storageInfo: 'Store refrigerated below 4°C.',
      nutritionInfo: '{"calories":"62 kcal","protein":"3.2g","fat":"4.5g","calcium":"120mg","carbohydrates":"4.7g"}',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod_buffalo_1l',
      name: 'Full Cream Buffalo Milk (1L)',
      slug: 'full-cream-buffalo-milk-1l',
      categoryId: 'cat_002',
      price: 78.0,
      subscriptionPrice: 72.0,
      unit: '1L',
      shelfLifeDays: 3,
      fatPercent: 6.8,
      snfPercent: 9.2,
      isOrganic: true,
      isFeatured: true,
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&auto=format&fit=crop&q=80',
      description: 'Creamy, nutrient-rich whole buffalo milk. Yields golden malai and rich homemade curd.',
      storageInfo: 'Store refrigerated at 4°C.',
      nutritionInfo: '{"calories":"97 kcal","protein":"4.0g","fat":"6.8g","calcium":"169mg","carbohydrates":"5.2g"}',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod_a2_1l',
      name: 'Vedic A2 Gir Cow Milk (1L)',
      slug: 'vedic-a2-gir-cow-milk-1l',
      categoryId: 'cat_003',
      price: 95.0,
      subscriptionPrice: 88.0,
      unit: '1L',
      shelfLifeDays: 3,
      fatPercent: 4.8,
      snfPercent: 8.9,
      isOrganic: true,
      isFeatured: true,
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=800&auto=format&fit=crop&q=80',
      description: 'Pure A2 beta-casein milk sourced exclusively from indigenous Gir and Sahiwal cows.',
      storageInfo: 'Keep chilled in glass bottle.',
      nutritionInfo: '{"calories":"65 kcal","protein":"3.4g","fat":"4.8g","calcium":"135mg","carbohydrates":"4.9g"}',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod_paneer_200g',
      name: 'Artisanal Malai Paneer (200g)',
      slug: 'artisanal-malai-paneer-200g',
      categoryId: 'cat_004',
      price: 90.0,
      subscriptionPrice: 84.0,
      unit: '200g',
      shelfLifeDays: 5,
      fatPercent: 22.0,
      snfPercent: 18.0,
      isOrganic: true,
      isFeatured: true,
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
      description: 'Freshly pressed soft malai paneer prepared daily at 5:00 AM from whole cow milk.',
      storageInfo: 'Store immersed in water inside chiller.',
      nutritionInfo: '{"calories":"265 kcal","protein":"18.3g","fat":"20.8g","calcium":"480mg","carbohydrates":"1.2g"}',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod_ghee_500ml',
      name: 'Vedic Bilona Cow Ghee (500ml Jar)',
      slug: 'vedic-bilona-cow-ghee-500ml',
      categoryId: 'cat_005',
      price: 650.0,
      subscriptionPrice: 620.0,
      unit: '500ml',
      shelfLifeDays: 180,
      fatPercent: 99.7,
      snfPercent: 0.1,
      isOrganic: true,
      isFeatured: true,
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop&q=80',
      description: 'Made using age-old Vedic bilona method: curd churned to makkhan and slow simmered.',
      storageInfo: 'Store in cool, dry place. Do not refrigerate.',
      nutritionInfo: '{"calories":"898 kcal","protein":"0g","fat":"99.7g","calcium":"0mg","carbohydrates":"0g"}',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod_curd_400g',
      name: 'Set Probiotic Curd (400g Matka)',
      slug: 'set-probiotic-curd-400g',
      categoryId: 'cat_006',
      price: 45.0,
      subscriptionPrice: 40.0,
      unit: '400g',
      shelfLifeDays: 7,
      fatPercent: 4.5,
      snfPercent: 8.5,
      isOrganic: true,
      isFeatured: false,
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80',
      description: 'Thick, creamy set curd prepared naturally in terracotta earthenware.',
      storageInfo: 'Store refrigerated below 4°C.',
      nutritionInfo: '{"calories":"60 kcal","protein":"3.5g","fat":"4.5g","calcium":"140mg","carbohydrates":"4.0g"}',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const addresses = [
    {
      id: 'addr_001',
      userId: 'usr_cust_001',
      type: 'HOME',
      receiverName: 'Rahul Sharma',
      receiverPhone: '+91 98111 22334',
      houseFlat: 'Flat 402, Tower B',
      apartmentStreet: 'Palm Meadows Heights',
      area: 'Sector 14',
      city: 'Gurugram',
      pincode: '122001',
      deliveryInstructions: 'Leave in blue insulated milk bag hooked outside door. Do not ring bell.',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'addr_002',
      userId: 'usr_cust_002',
      type: 'HOME',
      receiverName: 'Priya Patel',
      receiverPhone: '+91 98222 33445',
      houseFlat: 'House 88',
      apartmentStreet: 'Rosewood Boulevard',
      area: 'Sector 15-A',
      city: 'Gurugram',
      pincode: '122001',
      deliveryInstructions: 'Place on the milk table near main gate.',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const subscriptions = [
    {
      id: 'sub_001',
      userId: 'usr_cust_001',
      productId: 'prod_cow_1l',
      frequency: 'DAILY',
      quantity: 1,
      deliverySlot: 'MORNING_5_30_7_30',
      startDate: new Date(),
      status: 'ACTIVE',
      addressId: 'addr_001',
      paymentMethod: 'WALLET',
      dailyPrice: 58.0,
      notes: 'Morning fresh delivery',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'sub_002',
      userId: 'usr_cust_002',
      productId: 'prod_buffalo_1l',
      frequency: 'ALTERNATE_DAYS',
      quantity: 2,
      deliverySlot: 'MORNING_5_30_7_30',
      startDate: new Date(),
      status: 'ACTIVE',
      addressId: 'addr_002',
      paymentMethod: 'WALLET',
      dailyPrice: 144.0,
      notes: 'Thick buffalo milk for morning tea',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const subscriptionDeliveries: any[] = [];
  const today = new Date();
  for (let i = -5; i <= 25; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    subscriptionDeliveries.push({
      id: `sd_sub1_${i + 10}`,
      subscriptionId: 'sub_001',
      userId: 'usr_cust_001',
      productId: 'prod_cow_1l',
      deliveryDate: d,
      quantity: 1,
      deliverySlot: 'MORNING_5_30_7_30',
      status: i < 0 ? 'DELIVERED' : i === 2 ? 'SKIPPED' : 'SCHEDULED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const inventories = products.map((p) => ({
    id: `inv_${p.id}`,
    productId: p.id,
    currentStock: p.stock,
    quantity: p.stock,
    reservedQty: p.id === 'prod_cow_1l' ? 25 : 10,
    lowStockThreshold: 15,
    updatedAt: new Date(),
  }));

  const coupons = [
    {
      id: 'cpn_001',
      code: 'FRESH20',
      discountType: 'PERCENTAGE',
      discountValue: 20.0,
      minOrderAmount: 149.0,
      maxDiscount: 100.0,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
      isActive: true,
      usedCount: 42,
      description: '20% OFF on fresh morning dairy essentials',
    },
    {
      id: 'cpn_002',
      code: 'WELCOME50',
      discountType: 'FLAT',
      discountValue: 50.0,
      minOrderAmount: 199.0,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
      isActive: true,
      usedCount: 88,
      description: 'Flat ₹50 OFF on your first subscription or instant order',
    },
    {
      id: 'cpn_003',
      code: 'DAIRY100',
      discountType: 'FLAT',
      discountValue: 100.0,
      minOrderAmount: 499.0,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
      isActive: true,
      usedCount: 15,
      description: 'Flat ₹100 OFF on bulk milk and artisanal ghee orders above ₹499',
    },
  ];

  const orders = [
    {
      id: 'ord_001',
      orderNumber: 'ORD-20260828-101',
      userId: 'usr_cust_001',
      addressId: 'addr_001',
      status: 'DELIVERED',
      totalAmount: 180.0,
      subtotal: 180.0,
      deliveryFee: 0.0,
      discountAmount: 0.0,
      paymentStatus: 'PAID',
      paymentMethod: 'WALLET',
      deliveryDate: new Date(),
      deliverySlot: 'MORNING_5_30_7_30',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'oi_001',
          orderId: 'ord_001',
          productId: 'prod_paneer_200g',
          productName: 'Artisanal Malai Paneer (200g)',
          unit: '200g',
          unitPrice: 90.0,
          quantity: 2,
          totalPrice: 180.0,
        },
      ],
    },
  ];

  const deliveryRuns = [
    {
      id: 'run_001',
      routeName: 'Sector 14 & 15 Morning Route',
      slot: 'MORNING_5_30_7_30',
      date: new Date(),
      status: 'IN_PROGRESS',
      deliveryPersonId: 'dp_001',
      pincodes: ['122001', '122002'],
      totalStops: 4,
      completedStops: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const notifications = [
    {
      id: 'notif_001',
      userId: 'usr_cust_001',
      title: '🥛 Morning Milk Delivered!',
      message: 'Your 1L Pure Desi Cow Milk was placed in your door milk bag at 6:15 AM.',
      type: 'DELIVERY',
      linkUrl: '/orders',
      isRead: false,
      createdAt: new Date(),
    },
  ];

  const walletTransactions = [
    {
      id: 'wtx_001',
      userId: 'usr_cust_001',
      amount: 1000.0,
      type: 'CREDIT',
      balanceAfter: 1450.0,
      description: 'Milk Wallet Top-up via UPI (+₹40 bonus)',
      createdAt: new Date(),
    },
  ];

  return {
    users,
    customerProfiles,
    deliveryPersons,
    categories,
    products,
    productVariants: [],
    addresses,
    carts: [],
    cartItems: [],
    subscriptions,
    subscriptionDeliveries,
    orders,
    orderItems: orders.flatMap((o) => o.items),
    payments: [],
    walletTransactions,
    deliveryRuns,
    inventories,
    inventoryTransactions: [],
    coupons,
    notifications,
    auditLogs: [],
  };
}
