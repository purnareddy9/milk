import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { MilkRequirementModule } from './milk-requirement/milk-requirement.module';
import { PaymentsModule } from './payments/payments.module';
import { DeliveryModule } from './delivery/delivery.module';
import { InventoryModule } from './inventory/inventory.module';
import { CouponsModule } from './coupons/coupons.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    SubscriptionsModule,
    MilkRequirementModule,
    PaymentsModule,
    DeliveryModule,
    InventoryModule,
    CouponsModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
    SettingsModule,
  ],
})
export class AppModule {}
