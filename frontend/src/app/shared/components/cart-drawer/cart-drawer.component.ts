import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../pipes/milk-unit.pipe';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="drawer-backdrop" *ngIf="cartService.isCartDrawerOpen()" (click)="close()">
      <div class="drawer-content" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="drawer-header">
          <div class="header-left">
            <h2>🛒 My Fresh Cart</h2>
            <span class="items-count">{{ cartService.cartSignal().itemCount }} Items</span>
          </div>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <!-- Body -->
        <div class="drawer-body">
          <div class="empty-cart-state" *ngIf="cartService.cartSignal().items.length === 0">
            <span class="empty-icon">🥛</span>
            <h3>Your cart is empty</h3>
            <p>Fresh organic cow & buffalo milk is waiting for your morning tea!</p>
            <button class="btn btn-primary btn-sm" (click)="browseProducts()">Browse Dairy</button>
          </div>

          <div class="cart-items-list" *ngIf="cartService.cartSignal().items.length > 0">
            <div *ngFor="let item of cartService.cartSignal().items" class="cart-item-row">
              <img [src]="item.product.imageUrl" [alt]="item.product.name" class="item-img" />
              
              <div class="item-info">
                <span class="sub-badge" *ngIf="item.isSubscription">🥛 Daily Subscription</span>
                <span class="item-name">{{ item.product.name }}</span>
                <span class="item-unit">{{ item.product.unit | milkUnit }}</span>
                
                <div class="item-pricing">
                  <span class="unit-price">
                    {{ (item.isSubscription ? item.product.subscriptionPrice : item.product.price) | inrCurrency }}
                  </span>
                  <span class="item-total">
                    Total: {{ ((item.isSubscription ? item.product.subscriptionPrice : item.product.price) * item.quantity) | inrCurrency }}
                  </span>
                </div>
              </div>

              <div class="item-controls">
                <div class="qty-stepper">
                  <button (click)="cartService.updateQuantity(item.id, item.quantity - 1)">−</button>
                  <span class="qty-val">{{ item.quantity }}</span>
                  <button (click)="cartService.updateQuantity(item.id, item.quantity + 1)">+</button>
                </div>
                <button class="remove-btn" (click)="cartService.removeItem(item.id)">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="drawer-footer" *ngIf="cartService.cartSignal().items.length > 0">
          <div class="bill-breakdown">
            <div class="bill-row">
              <span>Items Subtotal</span>
              <strong>{{ cartService.cartSignal().subtotal | inrCurrency }}</strong>
            </div>

            <div class="bill-row">
              <span>Morning Delivery Fee</span>
              <span [class.free]="cartService.cartSignal().deliveryFee === 0">
                {{ cartService.cartSignal().deliveryFee === 0 ? 'FREE' : (cartService.cartSignal().deliveryFee | inrCurrency) }}
              </span>
            </div>

            <div class="free-delivery-tip" *ngIf="cartService.cartSignal().subtotal < 199 && cartService.cartSignal().subtotal > 0">
              <span>🚚 Add {{ (199 - cartService.cartSignal().subtotal) | inrCurrency }} more for FREE delivery!</span>
            </div>

            <div class="bill-row total-row">
              <span>To Pay</span>
              <span class="final-amt">{{ cartService.cartSignal().estimatedTotal | inrCurrency }}</span>
            </div>
          </div>

          <button class="btn btn-primary btn-block checkout-btn" (click)="goToCheckout()">
            Proceed to Fast Checkout →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(20, 28, 24, 0.5);
      backdrop-filter: blur(4px);
      z-index: 9600;
      display: flex;
      justify-content: flex-end;
    }

    .drawer-content {
      width: 100%;
      max-width: 440px;
      height: 100%;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      box-shadow: -8px 0 30px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.25s ease-out;
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .drawer-header {
      padding: 18px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--cream-bg);

      h2 {
        font-size: 1.15rem;
      }

      .items-count {
        font-size: 0.8rem;
        color: var(--primary);
        font-weight: 600;
      }
    }

    .close-btn {
      font-size: 1.25rem;
      color: var(--text-muted);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background-color: var(--border-subtle);
      }
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
    }

    .empty-cart-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 40px 20px;

      .empty-icon {
        font-size: 3.5rem;
        margin-bottom: 12px;
      }

      h3 {
        font-size: 1.2rem;
        margin-bottom: 6px;
      }

      p {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin-bottom: 20px;
      }
    }

    .cart-items-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .cart-item-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background-color: var(--bg-app);

      .item-img {
        width: 60px;
        height: 60px;
        border-radius: var(--radius-sm);
        object-fit: cover;
      }
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .sub-badge {
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }

      .item-name {
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--text-main);
      }

      .item-unit {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .item-pricing {
      display: flex;
      gap: 8px;
      margin-top: 4px;

      .unit-price {
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      .item-total {
        font-size: 0.85rem;
        font-weight: 800;
        color: var(--primary);
      }
    }

    .item-controls {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;

      .remove-btn {
        font-size: 0.85rem;
        opacity: 0.6;
        &:hover { opacity: 1; }
      }
    }

    .drawer-footer {
      padding: 18px 20px;
      border-top: 1px solid var(--border-subtle);
      background-color: #ffffff;
    }

    .bill-breakdown {
      margin-bottom: 16px;

      .bill-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        margin-bottom: 6px;

        .free {
          color: var(--success);
          font-weight: 700;
        }

        &.total-row {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-main);

          .final-amt {
            color: var(--primary);
          }
        }
      }

      .free-delivery-tip {
        background-color: var(--sky-subtle);
        color: var(--sky-blue);
        font-size: 0.75rem;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        margin: 6px 0;
      }
    }

    .checkout-btn {
      padding: 12px;
      font-size: 1rem;
    }
  `],
})
export class CartDrawerComponent {
  cartService = inject(CartService);
  router = inject(Router);

  close() {
    this.cartService.toggleCartDrawer(false);
  }

  browseProducts() {
    this.close();
    this.router.navigate(['/products']);
  }

  goToCheckout() {
    this.close();
    this.router.navigate(['/checkout']);
  }
}
