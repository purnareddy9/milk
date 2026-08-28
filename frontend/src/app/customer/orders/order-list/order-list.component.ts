import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus } from '../../../core/models';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../../shared/pipes/milk-unit.pipe';
import { format, parseISO } from 'date-fns';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="container orders-page">
      <!-- Header -->
      <div class="page-head">
        <div>
          <span class="breadcrumb">Account / Orders</span>
          <h1>My Orders & Live Tracking</h1>
          <p class="page-desc">Track your morning dairy deliveries in real-time and review previous invoices.</p>
        </div>
      </div>

      <!-- Orders List -->
      <div class="orders-list" *ngIf="orders().length > 0">
        <div *ngFor="let order of orders()" class="order-card card">
          <!-- Order Top Header -->
          <div class="order-top">
            <div class="order-id-meta">
              <span class="order-num">{{ order.orderNumber }}</span>
              <span class="order-date">Placed on {{ formatDate(order.createdAt) }}</span>
            </div>

            <div class="order-status-badge" [ngClass]="getStatusClass(order.status)">
              <span>{{ getStatusIcon(order.status) }} {{ formatStatus(order.status) }}</span>
            </div>
          </div>

          <!-- Live Step-by-Step Tracker (for active orders) -->
          <div class="live-tracker-box" *ngIf="order.status !== 'CANCELLED'">
            <div class="tracker-steps">
              <div class="track-step" [class.done]="isStepDone(order.status, 'CONFIRMED')" [class.current]="order.status === 'CONFIRMED'">
                <div class="step-circle">✓</div>
                <span>Confirmed</span>
              </div>

              <div class="track-line" [class.done]="isStepDone(order.status, 'PREPARING')"></div>

              <div class="track-step" [class.done]="isStepDone(order.status, 'PREPARING')" [class.current]="order.status === 'PREPARING'">
                <div class="step-circle">🥛</div>
                <span>Packing</span>
              </div>

              <div class="track-line" [class.done]="isStepDone(order.status, 'OUT_FOR_DELIVERY')"></div>

              <div class="track-step" [class.done]="isStepDone(order.status, 'OUT_FOR_DELIVERY')" [class.current]="order.status === 'OUT_FOR_DELIVERY'">
                <div class="step-circle">🛵</div>
                <span>Out for Delivery</span>
              </div>

              <div class="track-line" [class.done]="isStepDone(order.status, 'DELIVERED')"></div>

              <div class="track-step" [class.done]="isStepDone(order.status, 'DELIVERED')" [class.current]="order.status === 'DELIVERED'">
                <div class="step-circle">🏠</div>
                <span>Delivered</span>
              </div>
            </div>
          </div>

          <!-- Items Ordered -->
          <div class="order-items-grid">
            <div *ngFor="let item of order.items" class="order-item-row">
              <div class="item-main">
                <span class="item-name">🥛 {{ item.productName }}</span>
                <span class="item-unit">{{ item.quantity }}x ({{ item.unit | milkUnit }})</span>
              </div>
              <strong class="item-price">{{ item.totalPrice | inrCurrency }}</strong>
            </div>
          </div>

          <!-- Order Footer -->
          <div class="order-footer">
            <div class="delivery-meta">
              <span>🚚 Delivery Scheduled: <strong>{{ formatDate(order.deliveryDate) }} (5:30 – 7:30 AM)</strong></span>
              <span>📍 {{ order.address?.houseFlat }}, {{ order.address?.area }}</span>
            </div>

            <div class="order-total-action">
              <div class="total-box">
                <span class="tot-label">Total Paid ({{ order.paymentMethod }})</span>
                <strong class="tot-val">{{ order.totalAmount | inrCurrency }}</strong>
              </div>

              <button class="btn btn-secondary btn-sm reorder-btn" (click)="reorder(order)">
                🔄 Quick Re-Order
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-orders card" *ngIf="orders().length === 0">
        <span class="empty-icon">📦</span>
        <h2>No Orders Found</h2>
        <p>You haven't placed an order yet. Treat yourself to fresh organic milk and handcrafted paneer!</p>
        <a routerLink="/products" class="btn btn-primary btn-lg">Browse Dairy Catalog →</a>
      </div>
    </div>
  `,
  styles: [`
    .orders-page {
      padding: 32px 20px 60px;
    }

    .page-head {
      margin-bottom: 28px;
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 2rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .order-card {
      padding: 24px;
      border: 1.5px solid var(--border-subtle);
    }

    .order-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 14px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .order-id-meta {
      display: flex;
      flex-direction: column;

      .order-num {
        font-family: var(--font-heading);
        font-weight: 800;
        font-size: 1.15rem;
        color: var(--text-main);
      }

      .order-date {
        font-size: 0.78rem;
        color: var(--text-muted);
      }
    }

    .order-status-badge {
      font-size: 0.8rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: 0.03em;

      &.delivered { background-color: var(--success-bg); color: var(--success); }
      &.out_for_delivery { background-color: var(--sky-subtle); color: var(--sky-blue); }
      &.preparing { background-color: var(--warning-bg); color: var(--warning); }
      &.confirmed { background-color: var(--primary-subtle); color: var(--primary); }
      &.cancelled { background-color: var(--danger-bg); color: var(--danger); }
    }

    /* Live Progress Tracker */
    .live-tracker-box {
      background-color: var(--bg-app);
      border-radius: var(--radius-md);
      padding: 18px 24px;
      margin-bottom: 20px;
    }

    .tracker-steps {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .track-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      z-index: 2;

      .step-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--border-subtle);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.85rem;
        transition: all 0.2s ease;
      }

      span {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        white-space: nowrap;
      }

      &.done {
        .step-circle {
          background-color: var(--primary);
          color: #ffffff;
        }
        span {
          color: var(--text-main);
          font-weight: 700;
        }
      }

      &.current {
        .step-circle {
          box-shadow: 0 0 0 4px var(--primary-glow);
          background-color: var(--butter-gold);
          color: #ffffff;
        }
      }
    }

    .track-line {
      flex: 1;
      height: 3px;
      background-color: var(--border-subtle);
      margin: 0 8px;
      transform: translateY(-10px);
      transition: background-color 0.2s ease;

      &.done {
        background-color: var(--primary);
      }
    }

    .order-items-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }

    .order-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background-color: var(--bg-app);
      border-radius: var(--radius-sm);

      .item-main {
        display: flex;
        gap: 10px;
        align-items: center;

        .item-name {
          font-weight: 700;
          font-size: 0.9rem;
        }

        .item-unit {
          font-size: 0.78rem;
          color: var(--text-muted);
        }
      }

      .item-price {
        font-size: 0.95rem;
        color: var(--text-main);
      }
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-subtle);
      padding-top: 16px;
      flex-wrap: wrap;
      gap: 16px;

      .delivery-meta {
        display: flex;
        flex-direction: column;
        font-size: 0.85rem;
        color: var(--text-body);
        gap: 2px;
      }
    }

    .order-total-action {
      display: flex;
      align-items: center;
      gap: 16px;

      .total-box {
        text-align: right;
        display: flex;
        flex-direction: column;

        .tot-label {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .tot-val {
          font-size: 1.25rem;
          color: var(--primary);
        }
      }
    }

    .empty-orders {
      text-align: center;
      padding: 60px 20px;
      .empty-icon { font-size: 4rem; margin-bottom: 12px; }
      h2 { font-size: 1.5rem; margin-bottom: 8px; }
      p { color: var(--text-muted); margin-bottom: 24px; }
    }

    @media (max-width: 600px) {
      .tracker-steps { overflow-x: auto; padding-bottom: 8px; }
    }
  `],
})
export class OrderListComponent implements OnInit {
  api = inject(ApiService);
  cartService = inject(CartService);
  toast = inject(ToastService);

  orders = signal<Order[]>([]);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.api.get<Order[]>('orders/my').subscribe({
      next: (ords) => this.orders.set(ords || []),
      error: () => {},
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return format(parseISO(dateStr), 'dd MMM yyyy');
  }

  formatStatus(status: OrderStatus): string {
    return status.replace(/_/g, ' ');
  }

  getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case 'DELIVERED': return '✓';
      case 'OUT_FOR_DELIVERY': return '🛵';
      case 'PREPARING': return '🥛';
      case 'CONFIRMED': return '✓';
      case 'CANCELLED': return '✕';
      default: return '⏳';
    }
  }

  getStatusClass(status: OrderStatus): string {
    return status.toLowerCase();
  }

  isStepDone(currentStatus: OrderStatus, step: string): boolean {
    const sequence = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = sequence.indexOf(currentStatus);
    const stepIndex = sequence.indexOf(step);
    return currentIndex >= stepIndex;
  }

  reorder(order: Order) {
    for (const item of order.items) {
      if (item.product) {
        this.cartService.addToCart(item.product, item.quantity);
      }
    }
    this.toast.success('Items added to cart!');
    this.cartService.toggleCartDrawer(true);
  }
}
