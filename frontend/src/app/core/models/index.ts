export type Role = 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'DELIVERY_PERSON';

export type SubscriptionFrequency = 'DAILY' | 'ALTERNATE_DAYS' | 'WEEKDAYS' | 'WEEKENDS' | 'CUSTOM_DAYS';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
export type DeliverySlot = 'MORNING_5_30_7_30' | 'EVENING_5_00_7_00';
export type DeliveryStatus = 'SCHEDULED' | 'PREPARING' | 'DISPATCHED' | 'DELIVERED' | 'SKIPPED' | 'PAUSED' | 'FAILED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'RAZORPAY' | 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'COD';
export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  walletBalance: number;
  customerProfile?: CustomerProfile;
  deliveryPersonProfile?: DeliveryPersonProfile;
  addresses?: Address[];
  createdAt?: string;
}

export interface CustomerProfile {
  id: string;
  loyaltyPoints: number;
  totalSpent: number;
  orderCount: number;
  notes?: string;
}

export interface DeliveryPersonProfile {
  id: string;
  vehicleType?: string;
  vehicleNumber?: string;
  assignedRoute?: string;
  isOnline: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  unit: string;
  price: number;
  subscriptionPrice: number;
  stock: number;
  isDefault: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  slug: string;
  description: string;
  unit: string;
  price: number;
  subscriptionPrice: number;
  stock: number;
  fatPercent?: number;
  snfPercent?: number;
  pasteurizationType?: string;
  shelfLifeDays: number;
  storageInfo?: string;
  ingredients?: string;
  nutritionInfo?: string; // JSON string
  isOrganic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  imageUrl: string;
  variants?: ProductVariant[];
  inventory?: { currentStock: number; reorderLevel: number };
}

export interface Address {
  id: string;
  userId?: string;
  type: AddressType;
  receiverName: string;
  receiverPhone: string;
  houseFlat: string;
  apartmentStreet: string;
  landmark?: string;
  area: string;
  city: string;
  pincode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
  isSubscription: boolean;
  frequency?: SubscriptionFrequency;
  customDays?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  estimatedTotal: number;
}

export interface Subscription {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  product: Product;
  frequency: SubscriptionFrequency;
  customDays?: string;
  quantity: number;
  deliverySlot: DeliverySlot;
  startDate: string;
  endDate?: string;
  status: SubscriptionStatus;
  pauseStartDate?: string;
  pauseEndDate?: string;
  addressId: string;
  address: Address;
  paymentMethod: PaymentMethod;
  dailyPrice: number;
  notes?: string;
  deliveries?: SubscriptionDelivery[];
  createdAt: string;
}

export interface SubscriptionDelivery {
  id: string;
  subscriptionId: string;
  subscription?: Subscription;
  userId: string;
  user?: User;
  deliveryDate: string;
  quantity: number;
  deliverySlot: DeliverySlot;
  status: DeliveryStatus;
  deliveryPersonId?: string;
  failureReason?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  orderType: 'INSTANT' | 'SUBSCRIPTION_GENERATED';
  subscriptionId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  deliveryDate: string;
  deliverySlot: DeliverySlot;
  addressId: string;
  address: Address;
  deliveryPersonId?: string;
  deliveryPerson?: { user: User };
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  couponCode?: string;
  tipAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  validUntil?: string;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER' | 'SUBSCRIPTION' | 'DELIVERY' | 'OFFER' | 'SYSTEM';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ProductRequirement {
  productId: string;
  productName: string;
  categorySlug: string;
  unit: string;
  imageUrl: string;
  subscriptionUnits: number;
  instantOrderUnits: number;
  totalUnitsRequired: number;
  totalVolumeLitersOrKg: number;
  currentStock: number;
  surplusOrDeficit: number;
  status: 'SUFFICIENT' | 'LOW' | 'SHORTAGE';
}

export interface MilkRequirementDashboard {
  date: string;
  slot: string;
  summary: {
    totalMilkLitersRequired: number;
    totalMilkLitersAvailable: number;
    netSurplusOrDeficitLiters: number;
    overallStatus: 'SUFFICIENT_STOCK' | 'DEFICIT_WARNING';
    totalSubscriptionsServing: number;
    totalInstantOrdersServing: number;
    totalDeliveryStops: number;
  };
  productBreakdown: ProductRequirement[];
}
