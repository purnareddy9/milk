import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Customer Experience
  {
    path: '',
    loadComponent: () =>
      import('./customer/layout/customer-layout.component').then(
        (m) => m.CustomerLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./customer/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./customer/products/product-list/product-list.component').then(
            (m) => m.ProductListComponent,
          ),
      },
      {
        path: 'products/:slug',
        loadComponent: () =>
          import(
            './customer/products/product-detail/product-detail.component'
          ).then((m) => m.ProductDetailComponent),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import(
            './customer/subscriptions/subscription-list/subscription-list.component'
          ).then((m) => m.SubscriptionListComponent),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./customer/checkout/checkout.component').then(
            (m) => m.CheckoutComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./customer/orders/order-list/order-list.component').then(
            (m) => m.OrderListComponent,
          ),
      },
      {
        path: 'addresses',
        loadComponent: () =>
          import('./customer/addresses/addresses.component').then(
            (m) => m.AddressesComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./customer/payments/payments.component').then(
            (m) => m.PaymentsComponent,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./customer/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./customer/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./customer/auth/auth-page.component').then(
            (m) => m.AuthPageComponent,
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./customer/auth/auth-page.component').then(
            (m) => m.AuthPageComponent,
          ),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./customer/auth/auth-page.component').then(
            (m) => m.AuthPageComponent,
          ),
      },
    ],
  },

  // Seller / Admin Operations Hub
  {
    path: 'seller',
    canActivate: [roleGuard],
    data: { roles: ['SELLER', 'ADMIN'] },
    loadComponent: () =>
      import('./seller/layout/seller-layout.component').then(
        (m) => m.SellerLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./seller/dashboard/dashboard.component').then(
            (m) => m.SellerDashboardComponent,
          ),
      },
      {
        path: 'milk-requirement',
        loadComponent: () =>
          import('./seller/milk-requirement/milk-requirement.component').then(
            (m) => m.MilkRequirementComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./seller/orders/seller-orders.component').then(
            (m) => m.SellerOrdersComponent,
          ),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import(
            './seller/subscriptions/seller-subscriptions.component'
          ).then((m) => m.SellerSubscriptionsComponent),
      },
      {
        path: 'delivery',
        loadComponent: () =>
          import('./seller/delivery/seller-delivery.component').then(
            (m) => m.SellerDeliveryComponent,
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./seller/inventory/seller-inventory.component').then(
            (m) => m.SellerInventoryComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./seller/products/seller-products.component').then(
            (m) => m.SellerProductsComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./seller/customers/seller-customers.component').then(
            (m) => m.SellerCustomersComponent,
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./seller/analytics/seller-analytics.component').then(
            (m) => m.SellerAnalyticsComponent,
          ),
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./seller/coupons/seller-coupons.component').then(
            (m) => m.SellerCouponsComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./seller/settings/seller-settings.component').then(
            (m) => m.SellerSettingsComponent,
          ),
      },
    ],
  },

  // Delivery Partner Mobile Sheet
  {
    path: 'delivery-partner',
    canActivate: [roleGuard],
    data: { roles: ['DELIVERY_PERSON', 'SELLER', 'ADMIN'] },
    loadComponent: () =>
      import('./delivery-partner/run-sheet.component').then(
        (m) => m.RunSheetComponent,
      ),
  },

  {
    path: '**',
    redirectTo: '',
  },
];
