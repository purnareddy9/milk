import { PrismaClient, Role, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Checking clean production seed state for Amrit Pure Dairy...');

  // 1. Staff Passwords
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Ensure Admin / Seller exists
  const existingSeller = await prisma.user.findFirst({
    where: {
      OR: [{ id: 'usr_seller_001' }, { email: 'admin@amritpuredairy.com' }],
    },
  });
  if (existingSeller) {
    await prisma.user.update({
      where: { id: existingSeller.id },
      data: {
        name: 'Ramesh Patel (Dairy Owner)',
        email: 'admin@amritpuredairy.com',
        role: Role.SELLER,
        passwordHash,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        id: 'usr_seller_001',
        name: 'Ramesh Patel (Dairy Owner)',
        email: 'admin@amritpuredairy.com',
        phone: '+91 98765 43210',
        passwordHash,
        role: Role.SELLER,
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        walletBalance: 0.00,
      },
    });
  }

  // 3. Ensure Delivery Partner exists
  const existingDriver = await prisma.user.findFirst({
    where: {
      OR: [{ id: 'usr_deliv_001' }, { email: 'suresh.kumar@amritpuredairy.com' }],
    },
  });
  if (existingDriver) {
    await prisma.user.update({
      where: { id: existingDriver.id },
      data: {
        name: 'Suresh Kumar',
        email: 'suresh.kumar@amritpuredairy.com',
        role: Role.DELIVERY_PERSON,
        passwordHash,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        id: 'usr_deliv_001',
        name: 'Suresh Kumar',
        email: 'suresh.kumar@amritpuredairy.com',
        phone: '+91 98333 44556',
        passwordHash,
        role: Role.DELIVERY_PERSON,
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        walletBalance: 0.00,
        deliveryPersonProfile: {
          create: {
            vehicleType: 'Electric Scooter (Eco-Carrier)',
            vehicleNumber: 'DL-01-EV-4421',
            assignedRoute: 'Sector 1-25 Morning Route',
            isOnline: true,
            currentLatitude: 28.6139,
            currentLongitude: 77.2090,
          },
        },
      },
    });
  }

  // 4. Product Categories
  const categories = [
    {
      id: 'cat_001',
      name: 'Pure Desi Cow Milk',
      slug: 'cow-milk',
      description: 'Raw & pasteurized pure cow milk collected fresh every dawn from grass-fed cows.',
      icon: 'glass',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
      sortOrder: 1,
    },
    {
      id: 'cat_002',
      name: 'Full Cream Buffalo Milk',
      slug: 'buffalo-milk',
      description: 'Rich, creamy 7.0%+ fat buffalo milk ideal for dense curd, tea, and traditional sweets.',
      icon: 'glass',
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
      sortOrder: 2,
    },
    {
      id: 'cat_003',
      name: 'Vedic A2 Gir Cow Milk',
      slug: 'a2-milk',
      description: 'Indigenous Gir cow milk rich in A2 beta-casein protein and natural minerals.',
      icon: 'sparkles',
      imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=600&auto=format&fit=crop&q=80',
      sortOrder: 3,
    },
    {
      id: 'cat_004',
      name: 'Farm Curd & Dahi',
      slug: 'curd',
      description: 'Thick, traditionally set probiotic dahi with natural sweetness.',
      icon: 'bowl',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
      sortOrder: 4,
    },
    {
      id: 'cat_005',
      name: 'Artisanal Malai Paneer',
      slug: 'paneer',
      description: 'Melt-in-mouth cottage cheese crafted fresh every dawn from whole cow milk.',
      icon: 'square',
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      sortOrder: 5,
    },
    {
      id: 'cat_006',
      name: 'Vedic Bilona Desi Ghee',
      slug: 'ghee',
      description: 'Slow-cooked golden aromatic ghee churned from cultured A2 curd with wooden bilona.',
      icon: 'flame',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      sortOrder: 6,
    },
    {
      id: 'cat_007',
      name: 'Masala Chaas & Buttermilk',
      slug: 'buttermilk',
      description: 'Refreshing spiced buttermilk infused with roasted cumin, mint, and rock salt.',
      icon: 'glass-water',
      imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80',
      sortOrder: 7,
    },
  ];

  for (const cat of categories) {
    const existingCat = await prisma.category.findFirst({
      where: {
        OR: [{ id: cat.id }, { slug: cat.slug }],
      },
    });
    if (existingCat) {
      await prisma.category.update({
        where: { id: existingCat.id },
        data: cat,
      });
    } else {
      await prisma.category.create({
        data: { ...cat, isActive: true },
      });
    }
  }

  // 5. Products Catalog
  const products = [
    {
      id: 'prod_001',
      categoryId: 'cat_001',
      name: 'Farm Fresh Organic Cow Milk',
      slug: 'farm-fresh-cow-milk',
      description: 'Pure, wholesome cow milk collected at 4:30 AM every morning and chilled immediately to 4°C. Free from hormones, antibiotics, or synthetic preservatives.',
      unit: '1L',
      price: 64.00,
      subscriptionPrice: 58.00,
      stock: 500,
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
      variants: [
        { name: '1 Liter Glass Bottle', unit: '1L', price: 64.00, subscriptionPrice: 58.00, stock: 350, isDefault: true },
        { name: '500ml Glass Bottle', unit: '500ml', price: 34.00, subscriptionPrice: 30.00, stock: 150, isDefault: false },
      ],
    },
    {
      id: 'prod_002',
      categoryId: 'cat_002',
      name: 'Full Cream Desi Buffalo Milk',
      slug: 'full-cream-buffalo-milk',
      description: 'Thick, creamy buffalo milk with natural 7.2% milk fat. Yields thick malai, dense curd, and rich tea/coffee.',
      unit: '1L',
      price: 78.00,
      subscriptionPrice: 70.00,
      stock: 350,
      fatPercent: 7.2,
      snfPercent: 9.2,
      pasteurizationType: 'Chilled Pasteurization',
      shelfLifeDays: 3,
      storageInfo: 'Store refrigerated below 4°C.',
      ingredients: '100% Raw Chilled Buffalo Milk',
      nutritionInfo: JSON.stringify({ calories: '97 kcal', protein: '4.1g', fat: '7.2g', calcium: '190mg', carbs: '5.2g' }),
      isOrganic: true,
      isFeatured: true,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
      variants: [
        { name: '1 Liter Glass Bottle', unit: '1L', price: 78.00, subscriptionPrice: 70.00, stock: 250, isDefault: true },
        { name: '500ml Glass Bottle', unit: '500ml', price: 42.00, subscriptionPrice: 38.00, stock: 100, isDefault: false },
      ],
    },
    {
      id: 'prod_003',
      categoryId: 'cat_003',
      name: 'Vedic A2 Gir Cow Raw Milk',
      slug: 'vedic-a2-gir-cow-milk',
      description: 'Cruelty-free milk from indigenous grass-fed Gir cows containing purely A2 beta-casein proteins. Easier to digest with enhanced natural immunity boosting nutrients.',
      unit: '1L',
      price: 90.00,
      subscriptionPrice: 82.00,
      stock: 200,
      fatPercent: 4.5,
      snfPercent: 8.8,
      pasteurizationType: 'Whole Raw Unprocessed / Flash Chilled',
      shelfLifeDays: 2,
      storageInfo: 'Boil before use if consumed within 48 hours.',
      ingredients: '100% Single-Origin A2 Gir Cow Milk',
      nutritionInfo: JSON.stringify({ calories: '66 kcal', protein: '3.6g', fat: '4.5g', calcium: '135mg', carbs: '4.9g' }),
      isOrganic: true,
      isFeatured: true,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=600&auto=format&fit=crop&q=80',
      variants: [
        { name: '1 Liter Heritage Glass Bottle', unit: '1L', price: 90.00, subscriptionPrice: 82.00, stock: 150, isDefault: true },
        { name: '500ml Glass Bottle', unit: '500ml', price: 48.00, subscriptionPrice: 44.00, stock: 50, isDefault: false },
      ],
    },
    {
      id: 'prod_004',
      categoryId: 'cat_005',
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
      variants: [
        { name: '200g Vacuum Pack', unit: '200g', price: 95.00, subscriptionPrice: 88.00, stock: 80, isDefault: true },
        { name: '500g Chef Pack', unit: '500g', price: 230.00, subscriptionPrice: 215.00, stock: 40, isDefault: false },
      ],
    },
    {
      id: 'prod_005',
      categoryId: 'cat_004',
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
      variants: [
        { name: '400g Tub', unit: '400g', price: 45.00, subscriptionPrice: 40.00, stock: 110, isDefault: true },
        { name: '1kg Family Tub', unit: '1kg', price: 100.00, subscriptionPrice: 90.00, stock: 50, isDefault: false },
      ],
    },
    {
      id: 'prod_006',
      categoryId: 'cat_006',
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
      variants: [
        { name: '500ml Glass Jar', unit: '500ml', price: 690.00, subscriptionPrice: 650.00, stock: 60, isDefault: true },
        { name: '1L Heritage Jar', unit: '1L', price: 1320.00, subscriptionPrice: 1250.00, stock: 30, isDefault: false },
      ],
    },
    {
      id: 'prod_007',
      categoryId: 'cat_007',
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
      variants: [
        { name: '300ml Bottle', unit: '300ml', price: 20.00, subscriptionPrice: 18.00, stock: 150, isDefault: true },
        { name: '500ml Bottle', unit: '500ml', price: 32.00, subscriptionPrice: 28.00, stock: 70, isDefault: false },
      ],
    },
  ];

  for (const prod of products) {
    const { variants, ...prodData } = prod;
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ id: prod.id }, { slug: prod.slug }],
      },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: prodData.name,
          slug: prodData.slug,
          categoryId: prodData.categoryId,
          description: prodData.description,
          unit: prodData.unit,
          price: prodData.price,
          subscriptionPrice: prodData.subscriptionPrice,
          stock: prodData.stock,
          fatPercent: prodData.fatPercent,
          snfPercent: prodData.snfPercent,
          pasteurizationType: prodData.pasteurizationType,
          shelfLifeDays: prodData.shelfLifeDays,
          storageInfo: prodData.storageInfo,
          ingredients: prodData.ingredients,
          nutritionInfo: prodData.nutritionInfo,
          isOrganic: prodData.isOrganic,
          isFeatured: prodData.isFeatured,
          isActive: true,
          imageUrl: prodData.imageUrl,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          ...prodData,
          variants: {
            create: variants,
          },
          inventory: {
            create: {
              currentStock: prod.stock,
              reorderLevel: 25,
              dailyConsumptionRate: 40,
            },
          },
        },
      });
    }
  }

  // 6. Promotional Coupons
  const coupons = [
    { code: 'WELCOME50', description: 'Flat ₹50 OFF on your first farm order', discountType: DiscountType.FIXED, discountValue: 50.00, minOrderValue: 200.00, usageLimit: 1000, usedCount: 0, isActive: true },
    { code: 'FRESH20', description: '20% OFF up to ₹100 on fresh dairy essentials', discountType: DiscountType.PERCENTAGE, discountValue: 20.00, minOrderValue: 150.00, maxDiscount: 100.00, usageLimit: 500, usedCount: 0, isActive: true },
    { code: 'DAIRY100', description: 'Flat ₹100 OFF on orders above ₹600 (Ghee & Special combos)', discountType: DiscountType.FIXED, discountValue: 100.00, minOrderValue: 600.00, usageLimit: 200, usedCount: 0, isActive: true },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  console.log('✅ Clean production catalog verified! Zero dummy customer accounts.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
