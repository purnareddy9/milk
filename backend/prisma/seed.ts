import { PrismaClient, Role, OrderType, OrderStatus, PaymentStatus, PaymentMethod, SubscriptionFrequency, SubscriptionStatus, DeliverySlot, DeliveryStatus, AddressType, InventoryChangeType, DiscountType, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Checking database seed state for Amrit Pure Dairy...');

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`✅ Database is already initialized with ${userCount} users. Preserving production user data.`);
    return;
  }

  console.log('🌱 Empty database detected. Running initial seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const seller = await prisma.user.create({
    data: {
      id: 'usr_seller_001',
      name: 'Ramesh Patel',
      email: 'admin@amritpuredairy.com',
      phone: '+91 98765 43210',
      passwordHash,
      role: Role.SELLER,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      walletBalance: 25000.00,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      id: 'usr_cust_001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 98111 22334',
      passwordHash,
      role: Role.CUSTOMER,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      walletBalance: 1450.00,
      customerProfile: {
        create: {
          loyaltyPoints: 340,
          totalSpent: 4850.00,
          orderCount: 18,
          notes: 'Subscribed to Daily Cow Milk. Prefers glass bottles left in milk bag.',
        },
      },
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      id: 'usr_cust_002',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+91 98222 33445',
      passwordHash,
      role: Role.CUSTOMER,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      walletBalance: 850.00,
      customerProfile: {
        create: {
          loyaltyPoints: 180,
          totalSpent: 2950.00,
          orderCount: 9,
          notes: 'Alternate days Buffalo Milk & weekly Paneer enthusiast.',
        },
      },
    },
  });

  const deliveryPerson = await prisma.user.create({
    data: {
      id: 'usr_deliv_001',
      name: 'Suresh Kumar',
      email: 'suresh.kumar@amritpuredairy.com',
      phone: '+91 98333 44556',
      passwordHash,
      role: Role.DELIVERY_PERSON,
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      walletBalance: 500.00,
      deliveryPersonProfile: {
        create: {
          vehicleType: 'Electric Scooter (Eco-Carrier)',
          vehicleNumber: 'DL-01-EV-4421',
          assignedRoute: 'Sector 1-15 & Green Park Morning Route',
          isOnline: true,
          currentLatitude: 28.6139,
          currentLongitude: 77.2090,
        },
      },
    },
  });

  const deliveryProfile = await prisma.deliveryPerson.findUnique({ where: { userId: deliveryPerson.id } });

  // 2. Addresses
  const address1 = await prisma.address.create({
    data: {
      id: 'addr_001',
      userId: customer1.id,
      type: AddressType.HOME,
      receiverName: 'Rahul Sharma',
      receiverPhone: '+91 98111 22334',
      houseFlat: 'Flat 402, Tower B',
      apartmentStreet: 'Palm Meadows Heights, Sector 14',
      landmark: 'Near Central Park Gate 2',
      area: 'Sector 14',
      city: 'Gurugram',
      pincode: '122001',
      deliveryInstructions: 'Leave in the blue insulated milk bag hooked outside door. Do not ring doorbell before 7:00 AM.',
      isDefault: true,
    },
  });

  const address2 = await prisma.address.create({
    data: {
      id: 'addr_002',
      userId: customer1.id,
      type: AddressType.WORK,
      receiverName: 'Rahul Sharma (Office)',
      receiverPhone: '+91 98111 22334',
      houseFlat: 'Floor 6, Tech Park',
      apartmentStreet: 'Cyber Hub Boulevard',
      landmark: 'Opposite Gateway Tower',
      area: 'DLF Phase 2',
      city: 'Gurugram',
      pincode: '122002',
      deliveryInstructions: 'Deliver to reception between 9:00 AM - 10:00 AM',
      isDefault: false,
    },
  });

  const address3 = await prisma.address.create({
    data: {
      id: 'addr_003',
      userId: customer2.id,
      type: AddressType.HOME,
      receiverName: 'Priya Patel',
      receiverPhone: '+91 98222 33445',
      houseFlat: 'Villa 18, Rosewood Enclave',
      apartmentStreet: 'Green Avenue, Sector 23',
      landmark: 'Next to Blossom Kindergarten',
      area: 'Sector 23',
      city: 'Gurugram',
      pincode: '122017',
      deliveryInstructions: 'Ring doorbell once and place bottle on milk tray.',
      isDefault: true,
    },
  });

  // 3. Categories
  const catCowMilk = await prisma.category.create({
    data: {
      id: 'cat_001',
      name: 'Fresh Cow Milk',
      slug: 'cow-milk',
      description: '100% pure, farm fresh organic cow milk chilled within 1 hour of milking.',
      icon: 'milk',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
      sortOrder: 1,
      isActive: true,
    },
  });

  const catBuffaloMilk = await prisma.category.create({
    data: {
      id: 'cat_002',
      name: 'Full Cream Buffalo Milk',
      slug: 'buffalo-milk',
      description: 'Rich, thick, creamy buffalo milk with 6.5%+ natural fat content.',
      icon: 'droplets',
      imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80',
      sortOrder: 2,
      isActive: true,
    },
  });

  const catA2Milk = await prisma.category.create({
    data: {
      id: 'cat_003',
      name: 'Vedic A2 Gir Cow Milk',
      slug: 'a2-milk',
      description: 'Indigenous Gir cow milk rich in A2 beta-casein protein and natural minerals.',
      icon: 'sparkles',
      imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=600&auto=format&fit=crop&q=80',
      sortOrder: 3,
      isActive: true,
    },
  });

  const catCurd = await prisma.category.create({
    data: {
      id: 'cat_004',
      name: 'Farm Curd & Dahi',
      slug: 'curd',
      description: 'Thick, traditionally set probiotic dahi with natural sweetness.',
      icon: 'bowl',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
      sortOrder: 4,
      isActive: true,
    },
  });

  const catPaneer = await prisma.category.create({
    data: {
      id: 'cat_005',
      name: 'Artisanal Malai Paneer',
      slug: 'paneer',
      description: 'Melt-in-mouth cottage cheese crafted fresh every dawn from whole cow milk.',
      icon: 'square',
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      sortOrder: 5,
      isActive: true,
    },
  });

  const catGhee = await prisma.category.create({
    data: {
      id: 'cat_006',
      name: 'Vedic Bilona Desi Ghee',
      slug: 'ghee',
      description: 'Slow-cooked golden aromatic ghee churned from cultured A2 curd with wooden bilona.',
      icon: 'flame',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      sortOrder: 6,
      isActive: true,
    },
  });

  const catButtermilk = await prisma.category.create({
    data: {
      id: 'cat_007',
      name: 'Masala Chaas & Buttermilk',
      slug: 'buttermilk',
      description: 'Refreshing spiced buttermilk infused with roasted cumin, mint, and rock salt.',
      icon: 'glass-water',
      imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80',
      sortOrder: 7,
      isActive: true,
    },
  });

  // 4. Products & Variants
  const p1 = await prisma.product.create({
    data: {
      id: 'prod_001',
      categoryId: catCowMilk.id,
      name: 'Farm Fresh Organic Cow Milk',
      slug: 'farm-fresh-cow-milk',
      description: 'Pure, wholesome cow milk collected at 4:30 AM every morning and chilled immediately to 4°C. Free from hormones, antibiotics, or synthetic preservatives.',
      unit: '1L',
      price: 64.00,
      subscriptionPrice: 58.00,
      stock: 350,
      fatPercent: 3.8,
      snfPercent: 8.5,
      pasteurizationType: 'Gentle Low-Temp Chilled Pasteurization',
      shelfLifeDays: 3,
      storageInfo: 'Store under refrigeration at 2°C - 4°C. Consume within 3 days of opening.',
      ingredients: '100% Fresh Cow Milk',
      nutritionInfo: JSON.stringify({ calories: '62 kcal', protein: '3.4g', fat: '3.8g', calcium: '120mg', carbs: '4.8g' }),
      isOrganic: true,
      isFeatured: true,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
      variants: {
        create: [
          { name: '500ml Eco Pouch', unit: '500ml', price: 34.00, subscriptionPrice: 30.00, stock: 200, isDefault: false },
          { name: '1L Glass Bottle', unit: '1L', price: 64.00, subscriptionPrice: 58.00, stock: 350, isDefault: true },
          { name: '2L Family Canister', unit: '2L', price: 125.00, subscriptionPrice: 114.00, stock: 80, isDefault: false },
        ],
      },
      inventory: {
        create: {
          currentStock: 350,
          reorderLevel: 50,
          dailyConsumptionRate: 140,
        },
      },
    },
  });

  const p2 = await prisma.product.create({
    data: {
      id: 'prod_002',
      categoryId: catBuffaloMilk.id,
      name: 'Full Cream Village Buffalo Milk',
      slug: 'full-cream-buffalo-milk',
      description: 'Rich, wholesome, high-fat buffalo milk. Ideal for thick creamy tea, aromatic coffee, rich desserts, and making thick malai curd.',
      unit: '1L',
      price: 76.00,
      subscriptionPrice: 70.00,
      stock: 240,
      fatPercent: 6.8,
      snfPercent: 9.2,
      pasteurizationType: 'Fresh Batch Chilled Pasteurization',
      shelfLifeDays: 3,
      storageInfo: 'Keep refrigerated below 4°C.',
      ingredients: '100% Pure Buffalo Milk',
      nutritionInfo: JSON.stringify({ calories: '97 kcal', protein: '4.2g', fat: '6.8g', calcium: '170mg', carbs: '5.2g' }),
      isOrganic: true,
      isFeatured: true,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80',
      variants: {
        create: [
          { name: '500ml Eco Pouch', unit: '500ml', price: 40.00, subscriptionPrice: 36.00, stock: 150, isDefault: false },
          { name: '1L Glass Bottle', unit: '1L', price: 76.00, subscriptionPrice: 70.00, stock: 240, isDefault: true },
        ],
      },
      inventory: {
        create: {
          currentStock: 240,
          reorderLevel: 40,
          dailyConsumptionRate: 90,
        },
      },
    },
  });

  const p3 = await prisma.product.create({
    data: {
      id: 'prod_003',
      categoryId: catA2Milk.id,
      name: 'Vedic A2 Desi Gir Cow Milk',
      slug: 'a2-desi-gir-cow-milk',
      description: 'Sourced from grass-fed indigenous Gir cows. Naturally rich in A2 protein, easy to digest, with natural sweetness and immunity-boosting carotenoids.',
      unit: '1L',
      price: 88.00,
      subscriptionPrice: 80.00,
      stock: 180,
      fatPercent: 4.5,
      snfPercent: 8.8,
      pasteurizationType: 'Traditional Chilled Churn HTST',
      shelfLifeDays: 3,
      storageInfo: 'Store in refrigerator at 2°C - 4°C.',
      ingredients: '100% Pure Indigenous A2 Gir Cow Milk',
      nutritionInfo: JSON.stringify({ calories: '72 kcal', protein: '3.6g', fat: '4.5g', calcium: '145mg', carbs: '4.9g' }),
      isOrganic: true,
      isFeatured: true,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=600&auto=format&fit=crop&q=80',
      variants: {
        create: [
          { name: '1L Heritage Glass Bottle', unit: '1L', price: 88.00, subscriptionPrice: 80.00, stock: 180, isDefault: true },
        ],
      },
      inventory: {
        create: {
          currentStock: 180,
          reorderLevel: 30,
          dailyConsumptionRate: 60,
        },
      },
    },
  });

  const p4 = await prisma.product.create({
    data: {
      id: 'prod_004',
      categoryId: catPaneer.id,
      name: 'Fresh Malai Paneer (Farm Made)',
      slug: 'fresh-malai-paneer',
      description: 'Soft, creamy, melt-in-mouth cottage cheese crafted fresh every morning using natural lemon coagulant. Zero cornstarch or artificial thickeners.',
      unit: '200g',
      price: 95.00,
      subscriptionPrice: 88.00,
      stock: 120,
      fatPercent: 24.0,
      snfPercent: 32.0,
      pasteurizationType: 'Fresh Hot Curd Pressed',
      shelfLifeDays: 7,
      storageInfo: 'Immerse in clean water inside refrigerator or use fresh within 7 days.',
      ingredients: 'Fresh Whole Milk, Natural Lemon Coagulant, Water',
      nutritionInfo: JSON.stringify({ calories: '265 kcal', protein: '18.3g', fat: '20.8g', calcium: '208mg', carbs: '1.2g' }),
      isOrganic: true,
      isFeatured: true,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      variants: {
        create: [
          { name: '200g Vacuum Pack', unit: '200g', price: 95.00, subscriptionPrice: 88.00, stock: 80, isDefault: true },
          { name: '500g Chef Pack', unit: '500g', price: 230.00, subscriptionPrice: 215.00, stock: 40, isDefault: false },
        ],
      },
      inventory: {
        create: {
          currentStock: 120,
          reorderLevel: 25,
          dailyConsumptionRate: 35,
        },
      },
    },
  });

  const p5 = await prisma.product.create({
    data: {
      id: 'prod_005',
      categoryId: catCurd.id,
      name: 'Traditional Set Farm Dahi (Curd)',
      slug: 'traditional-set-farm-dahi',
      description: 'Naturally fermented with live artisanal probiotic cultures. Thick, non-sour, sweet aftertaste, perfect with parathas or as raita.',
      unit: '400g',
      price: 45.00,
      subscriptionPrice: 40.00,
      stock: 160,
      fatPercent: 4.5,
      snfPercent: 9.0,
      pasteurizationType: 'Cultured Earthen Pot Set',
      shelfLifeDays: 5,
      storageInfo: 'Store under refrigeration at 4°C.',
      ingredients: 'Pasteurized Full Cream Milk, Active Probiotic Lactic Cultures',
      nutritionInfo: JSON.stringify({ calories: '68 kcal', protein: '3.8g', fat: '4.2g', calcium: '130mg', carbs: '4.0g' }),
      isOrganic: true,
      isFeatured: true,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
      variants: {
        create: [
          { name: '400g Tub', unit: '400g', price: 45.00, subscriptionPrice: 40.00, stock: 110, isDefault: true },
          { name: '1kg Family Tub', unit: '1kg', price: 100.00, subscriptionPrice: 90.00, stock: 50, isDefault: false },
        ],
      },
      inventory: {
        create: {
          currentStock: 160,
          reorderLevel: 30,
          dailyConsumptionRate: 45,
        },
      },
    },
  });

  const p6 = await prisma.product.create({
    data: {
      id: 'prod_006',
      categoryId: catGhee.id,
      name: 'Vedic A2 Cultured Bilona Ghee',
      slug: 'vedic-a2-cultured-bilona-ghee',
      description: 'Handcrafted following ancient 5-step Vedic Bilona method: Grass-fed A2 Gir Cow Milk -> Fermented Curd -> Two-way Wooden Churned Makkhan -> Slow woodfire boiled golden granules.',
      unit: '500ml',
      price: 690.00,
      subscriptionPrice: 650.00,
      stock: 90,
      fatPercent: 99.7,
      snfPercent: 0.3,
      pasteurizationType: 'Slow Woodfire Boiled',
      shelfLifeDays: 270,
      storageInfo: 'Store in a cool dry place away from direct sunlight. Do not refrigerate.',
      ingredients: 'Cultured A2 Gir Cow Milk Fat',
      nutritionInfo: JSON.stringify({ calories: '898 kcal', protein: '0g', fat: '99.7g', calcium: '0mg', carbs: '0g' }),
      isOrganic: true,
      isFeatured: true,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      variants: {
        create: [
          { name: '500ml Glass Jar', unit: '500ml', price: 690.00, subscriptionPrice: 650.00, stock: 60, isDefault: true },
          { name: '1L Heritage Jar', unit: '1L', price: 1320.00, subscriptionPrice: 1250.00, stock: 30, isDefault: false },
        ],
      },
      inventory: {
        create: {
          currentStock: 90,
          reorderLevel: 15,
          dailyConsumptionRate: 8,
        },
      },
    },
  });

  const p7 = await prisma.product.create({
    data: {
      id: 'prod_007',
      categoryId: catButtermilk.id,
      name: 'Masala Spiced Chaas (Mint & Cumin)',
      slug: 'masala-spiced-chaas',
      description: 'Refreshing traditional buttermilk infused with hand-pounded roasted jeera, fresh garden mint, green chilies, ginger, and pink Himalayan rock salt.',
      unit: '300ml',
      price: 20.00,
      subscriptionPrice: 18.00,
      stock: 220,
      fatPercent: 1.5,
      snfPercent: 6.0,
      pasteurizationType: 'Chilled Cultured Whey Blend',
      shelfLifeDays: 5,
      storageInfo: 'Keep chilled. Shake well before drinking.',
      ingredients: 'Cultured Buttermilk, Fresh Mint, Roasted Cumin, Himalayan Rock Salt, Ginger',
      nutritionInfo: JSON.stringify({ calories: '32 kcal', protein: '1.8g', fat: '1.2g', calcium: '70mg', carbs: '3.1g' }),
      isOrganic: true,
      isFeatured: false,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80',
      variants: {
        create: [
          { name: '300ml Bottle', unit: '300ml', price: 20.00, subscriptionPrice: 18.00, stock: 150, isDefault: true },
          { name: '500ml Bottle', unit: '500ml', price: 32.00, subscriptionPrice: 28.00, stock: 70, isDefault: false },
        ],
      },
      inventory: {
        create: {
          currentStock: 220,
          reorderLevel: 40,
          dailyConsumptionRate: 65,
        },
      },
    },
  });

  // 5. Subscriptions
  const today = new Date();
  const sub1 = await prisma.subscription.create({
    data: {
      id: 'sub_001',
      userId: customer1.id,
      productId: p1.id,
      frequency: SubscriptionFrequency.DAILY,
      quantity: 1,
      deliverySlot: DeliverySlot.MORNING_5_30_7_30,
      startDate: new Date(today.getFullYear(), today.getMonth(), 1),
      status: SubscriptionStatus.ACTIVE,
      addressId: address1.id,
      paymentMethod: PaymentMethod.WALLET,
      dailyPrice: 58.00,
      notes: 'Please ensure cold temperature on delivery.',
    },
  });

  const sub2 = await prisma.subscription.create({
    data: {
      id: 'sub_002',
      userId: customer2.id,
      productId: p2.id,
      frequency: SubscriptionFrequency.ALTERNATE_DAYS,
      quantity: 1,
      deliverySlot: DeliverySlot.MORNING_5_30_7_30,
      startDate: new Date(today.getFullYear(), today.getMonth(), 2),
      status: SubscriptionStatus.ACTIVE,
      addressId: address3.id,
      paymentMethod: PaymentMethod.RAZORPAY,
      dailyPrice: 70.00,
      notes: 'Morning alternate day delivery.',
    },
  });

  // Generate 30 days of deliveries for sub1 and sub2
  for (let i = -7; i <= 25; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);

    let status: DeliveryStatus = DeliveryStatus.SCHEDULED;
    let deliveredAt: Date | null = null;
    let failureReason: string | null = null;

    if (i < 0) {
      status = DeliveryStatus.DELIVERED;
      deliveredAt = new Date(d);
      deliveredAt.setHours(6, 45, 0, 0);
    } else if (i === 0) {
      status = DeliveryStatus.DELIVERED;
      deliveredAt = new Date();
      deliveredAt.setHours(6, 50, 0, 0);
    } else if (i === 3) {
      status = DeliveryStatus.SKIPPED; // User skipped day +3 for demo
    }

    await prisma.subscriptionDelivery.create({
      data: {
        subscriptionId: sub1.id,
        userId: customer1.id,
        deliveryDate: d,
        quantity: 1,
        deliverySlot: DeliverySlot.MORNING_5_30_7_30,
        status: status,
        deliveryPersonId: deliveryProfile?.id,
        deliveredAt,
        failureReason,
      },
    });

    // Sub 2 is alternate days
    if (i % 2 === 0) {
      await prisma.subscriptionDelivery.create({
        data: {
          subscriptionId: sub2.id,
          userId: customer2.id,
          deliveryDate: d,
          quantity: 1,
          deliverySlot: DeliverySlot.MORNING_5_30_7_30,
          status: i <= 0 ? DeliveryStatus.DELIVERED : DeliveryStatus.SCHEDULED,
          deliveryPersonId: deliveryProfile?.id,
          deliveredAt: i <= 0 ? new Date(d.getTime() + 7 * 3600 * 1000) : null,
        },
      });
    }
  }

  // 6. Orders
  const order1 = await prisma.order.create({
    data: {
      id: 'ord_001',
      orderNumber: 'ORD-2026-8801',
      userId: customer1.id,
      orderType: OrderType.INSTANT,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.WALLET,
      deliveryDate: today,
      deliverySlot: DeliverySlot.MORNING_5_30_7_30,
      addressId: address1.id,
      deliveryPersonId: deliveryProfile?.id,
      subtotal: 254.00,
      deliveryFee: 0.00,
      discountAmount: 20.00,
      couponCode: 'FRESH20',
      totalAmount: 234.00,
      items: {
        create: [
          { productId: p1.id, productName: 'Farm Fresh Organic Cow Milk', unit: '1L', quantity: 2, unitPrice: 64.00, totalPrice: 128.00 },
          { productId: p4.id, productName: 'Fresh Malai Paneer (Farm Made)', unit: '200g', quantity: 1, unitPrice: 95.00, totalPrice: 95.00 },
          { productId: p7.id, productName: 'Masala Spiced Chaas (Mint & Cumin)', unit: '300ml', quantity: 1, unitPrice: 20.00, totalPrice: 20.00 },
        ],
      },
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const order2 = await prisma.order.create({
    data: {
      id: 'ord_002',
      orderNumber: 'ORD-2026-8802',
      userId: customer2.id,
      orderType: OrderType.INSTANT,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.RAZORPAY,
      paymentId: 'pay_rzp_mock_9921',
      deliveryDate: tomorrow,
      deliverySlot: DeliverySlot.MORNING_5_30_7_30,
      addressId: address3.id,
      deliveryPersonId: deliveryProfile?.id,
      subtotal: 780.00,
      deliveryFee: 0.00,
      discountAmount: 50.00,
      couponCode: 'WELCOME50',
      totalAmount: 730.00,
      items: {
        create: [
          { productId: p6.id, productName: 'Vedic A2 Cultured Bilona Ghee', unit: '500ml', quantity: 1, unitPrice: 690.00, totalPrice: 690.00 },
          { productId: p5.id, productName: 'Traditional Set Farm Dahi (Curd)', unit: '400g', quantity: 2, unitPrice: 45.00, totalPrice: 90.00 },
        ],
      },
    },
  });

  // 7. Wallet Transactions
  await prisma.walletTransaction.createMany({
    data: [
      { userId: customer1.id, type: 'CREDIT', amount: 2000.00, balanceAfter: 2000.00, description: 'Wallet Recharge via UPI', referenceType: 'TOPUP' },
      { userId: customer1.id, type: 'DEBIT', amount: 234.00, balanceAfter: 1766.00, description: 'Payment for Order #ORD-2026-8801', referenceType: 'ORDER', referenceId: order1.id },
      { userId: customer1.id, type: 'DEBIT', amount: 316.00, balanceAfter: 1450.00, description: 'Daily Milk Subscription Deductions (7 days)', referenceType: 'SUBSCRIPTION', referenceId: sub1.id },
    ],
  });

  // 8. Coupons
  await prisma.coupon.createMany({
    data: [
      { code: 'FRESH20', description: '20% OFF up to ₹100 on fresh dairy essentials', discountType: DiscountType.PERCENTAGE, discountValue: 20.00, minOrderValue: 150.00, maxDiscount: 100.00, usageLimit: 500, usedCount: 42, isActive: true },
      { code: 'WELCOME50', description: 'Flat ₹50 OFF on your first farm order', discountType: DiscountType.FIXED, discountValue: 50.00, minOrderValue: 200.00, usageLimit: 1000, usedCount: 88, isActive: true },
      { code: 'DAIRY100', description: 'Flat ₹100 OFF on orders above ₹600 (Ghee & Special combos)', discountType: DiscountType.FIXED, discountValue: 100.00, minOrderValue: 600.00, usageLimit: 200, usedCount: 14, isActive: true },
    ],
  });

  // 9. Notifications
  await prisma.notification.createMany({
    data: [
      { userId: customer1.id, title: '🥛 Morning Milk Delivered!', message: 'Your fresh 1L Cow Milk was delivered at 6:45 AM. Have a healthy morning!', type: NotificationType.DELIVERY, isRead: true },
      { userId: customer1.id, title: '🔔 Tomorrow\'s Delivery Scheduled', message: 'Morning delivery window: 5:30 AM - 7:30 AM. Need to skip? You can skip before 10 PM.', type: NotificationType.SUBSCRIPTION, isRead: false },
      { userId: customer2.id, title: '✨ Order Confirmed #ORD-2026-8802', message: 'Your order for Vedic Bilona Ghee & Curd is scheduled for tomorrow morning.', type: NotificationType.ORDER, isRead: false },
    ],
  });

  // 10. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { userId: seller.id, userRole: Role.SELLER, action: 'CREATE_PRODUCT', entityType: 'PRODUCT', entityId: p1.id, newValueJson: JSON.stringify({ name: p1.name, price: 64.00 }) },
      { userId: seller.id, userRole: Role.SELLER, action: 'INVENTORY_BATCH_PROCURED', entityType: 'INVENTORY', entityId: p1.id, newValueJson: JSON.stringify({ batchLiters: 150, fatPercent: 3.8 }) },
    ],
  });

  console.log('✅ Seed complete! Seeded 4 Users, 7 Categories, 7 Products, 2 Subscriptions with 30-day schedules, 2 Orders, Addresses, Wallet Ledger, and Coupons.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
