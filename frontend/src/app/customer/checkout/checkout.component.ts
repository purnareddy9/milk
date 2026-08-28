import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Address, DeliverySlot, PaymentMethod, Order } from '../../core/models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../shared/pipes/milk-unit.pipe';
import * as confetti from 'canvas-confetti';
import { format, addDays } from 'date-fns';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="container checkout-page">
      <!-- Header -->
      <div class="checkout-head">
        <span class="breadcrumb"><a routerLink="/cart">Cart</a> / Fast Checkout</span>
        <h1>⚡ Secure Farm Checkout</h1>
        <span class="secure-badge">🔒 256-Bit SSL Encrypted</span>
      </div>

      <!-- Checkout Grid -->
      <div class="checkout-grid" *ngIf="cartService.cartSignal().items.length > 0">
        <!-- Left Column: Checkout Steps -->
        <div class="checkout-steps">
          <!-- 1. Delivery Address -->
          <div class="step-card card">
            <div class="step-title">
              <span class="step-badge">1</span>
              <h3>Delivery Address</h3>
            </div>

            <div class="addresses-list" *ngIf="addresses().length > 0">
              <div
                *ngFor="let addr of addresses()"
                class="address-card"
                [class.selected]="selectedAddressId() === addr.id"
                (click)="selectedAddressId.set(addr.id)"
              >
                <div class="addr-head">
                  <span class="addr-type">{{ addr.type }}</span>
                  <span class="select-check" *ngIf="selectedAddressId() === addr.id">✓ Selected</span>
                </div>
                <strong>{{ addr.receiverName }} · {{ addr.receiverPhone }}</strong>
                <p>{{ addr.houseFlat }}, {{ addr.apartmentStreet }}, {{ addr.area }}, {{ addr.city }} - {{ addr.pincode }}</p>
                <span class="instructions" *ngIf="addr.deliveryInstructions">
                  📝 {{ addr.deliveryInstructions }}
                </span>
              </div>
            </div>

            <div class="no-address" *ngIf="addresses().length === 0">
              <p>Default delivery address: Flat 402, Tower B, Sector 14, Gurugram</p>
            </div>
          </div>

          <!-- 2. Delivery Date & Time Slot -->
          <div class="step-card card">
            <div class="step-title">
              <span class="step-badge">2</span>
              <h3>Delivery Date & Morning Slot</h3>
            </div>

            <div class="slot-select-row">
              <div class="form-group">
                <label>Select Delivery Date</label>
                <input
                  type="date"
                  [(ngModel)]="deliveryDate"
                  [min]="minDeliveryDate"
                  class="form-control"
                />
              </div>

              <div class="slots-options">
                <div
                  class="slot-option"
                  [class.active]="deliverySlot() === 'MORNING_5_30_7_30'"
                  (click)="deliverySlot.set('MORNING_5_30_7_30')"
                >
                  <span class="slot-icon">🌅</span>
                  <div class="slot-meta">
                    <strong>Early Morning</strong>
                    <span>5:30 AM – 7:30 AM</span>
                  </div>
                </div>

                <div
                  class="slot-option"
                  [class.active]="deliverySlot() === 'EVENING_5_00_7_00'"
                  (click)="deliverySlot.set('EVENING_5_00_7_00')"
                >
                  <span class="slot-icon">🌆</span>
                  <div class="slot-meta">
                    <strong>Evening Batch</strong>
                    <span>5:00 PM – 7:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Payment Method -->
          <div class="step-card card">
            <div class="step-title">
              <span class="step-badge">3</span>
              <h3>Payment Method</h3>
            </div>

            <div class="payment-options-list">
              <!-- Milk Wallet -->
              <label class="pay-method-card" [class.selected]="paymentMethod() === 'WALLET'">
                <input type="radio" name="payMethod" [value]="'WALLET'" [(ngModel)]="selectedPayMethod" (change)="onPaymentMethodChange('WALLET')" />
                <div class="pay-icon">💰</div>
                <div class="pay-details">
                  <strong>Milk Wallet (Instant 1-Click Pay)</strong>
                  <span>Available Balance: {{ (auth.currentUser?.walletBalance || 0) | inrCurrency }}</span>
                </div>
                <span class="rec-badge">Fastest</span>
              </label>

              <!-- Razorpay UPI / Cards -->
              <label class="pay-method-card" [class.selected]="paymentMethod() === 'RAZORPAY'">
                <input type="radio" name="payMethod" [value]="'RAZORPAY'" [(ngModel)]="selectedPayMethod" (change)="onPaymentMethodChange('RAZORPAY')" />
                <div class="pay-icon">💳</div>
                <div class="pay-details">
                  <strong>Razorpay (UPI, Google Pay, PhonePe, Cards, NetBanking)</strong>
                  <span>Direct secure payment gateway</span>
                </div>
              </label>

              <!-- Cash on Delivery -->
              <label class="pay-method-card" [class.selected]="paymentMethod() === 'COD'">
                <input type="radio" name="payMethod" [value]="'COD'" [(ngModel)]="selectedPayMethod" (change)="onPaymentMethodChange('COD')" />
                <div class="pay-icon">💵</div>
                <div class="pay-details">
                  <strong>Cash / UPI on Delivery</strong>
                  <span>Pay upon morning doorstep arrival</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Right Column: Order Summary & Coupon -->
        <div class="order-summary-sidebar">
          <!-- Coupon Box -->
          <div class="coupon-card card">
            <h4>🏷️ Have a Promo Code?</h4>
            <div class="coupon-input-group">
              <input
                type="text"
                [(ngModel)]="couponCode"
                placeholder="e.g. FRESH20, WELCOME50"
                class="coupon-input"
                [disabled]="isCouponApplied()"
              />
              <button
                class="btn btn-primary btn-sm"
                *ngIf="!isCouponApplied()"
                (click)="applyCoupon()"
              >
                Apply
              </button>
              <button
                class="btn btn-light btn-sm"
                *ngIf="isCouponApplied()"
                (click)="removeCoupon()"
              >
                Remove
              </button>
            </div>

            <div class="coupon-success-msg" *ngIf="isCouponApplied()">
              <span>✓ Coupon {{ couponCode }} applied (-{{ discountAmount() | inrCurrency }})</span>
            </div>

            <!-- Quick Promo Suggestions -->
            <div class="suggested-coupons" *ngIf="!isCouponApplied()">
              <span class="sugg-tag" (click)="setAndApplyCoupon('FRESH20')">FRESH20 (20% OFF)</span>
              <span class="sugg-tag" (click)="setAndApplyCoupon('WELCOME50')">WELCOME50 (Flat ₹50)</span>
            </div>
          </div>

          <!-- Items in Order -->
          <div class="items-card card">
            <h4>📦 Order Items ({{ cartService.cartSignal().itemCount }})</h4>
            <div class="items-mini-list">
              <div *ngFor="let item of cartService.cartSignal().items" class="mini-item">
                <img [src]="item.product.imageUrl" [alt]="item.product.name" class="mini-thumb" />
                <div class="mini-info">
                  <strong>{{ item.product.name }}</strong>
                  <span>{{ item.quantity }}x {{ item.product.unit | milkUnit }}</span>
                </div>
                <strong class="mini-price">
                  {{ ((item.isSubscription ? item.product.subscriptionPrice : item.product.price) * item.quantity) | inrCurrency }}
                </strong>
              </div>
            </div>

            <!-- Bill Breakdown -->
            <div class="bill-ledger">
              <div class="ledger-row">
                <span>Items Subtotal</span>
                <span>{{ cartService.cartSignal().subtotal | inrCurrency }}</span>
              </div>

              <div class="ledger-row" *ngIf="discountAmount() > 0">
                <span class="discount-label">Coupon Discount</span>
                <span class="discount-amt">−{{ discountAmount() | inrCurrency }}</span>
              </div>

              <div class="ledger-row">
                <span>Morning Delivery Fee</span>
                <span [class.free]="deliveryFee() === 0">
                  {{ deliveryFee() === 0 ? 'FREE' : (deliveryFee() | inrCurrency) }}
                </span>
              </div>

              <div class="ledger-row total-row">
                <span>Final Amount to Pay</span>
                <span class="grand-total">{{ finalTotal() | inrCurrency }}</span>
              </div>
            </div>

            <!-- Place Order CTA -->
            <button
              class="btn btn-gold btn-block btn-lg place-order-btn"
              [disabled]="isPlacingOrder()"
              (click)="placeOrder()"
            >
              {{ isPlacingOrder() ? 'Processing Order...' : '✨ Place Order (' + (finalTotal() | inrCurrency) + ')' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty Cart State -->
      <div class="empty-checkout card" *ngIf="cartService.cartSignal().items.length === 0">
        <span class="empty-icon">🛒</span>
        <h2>Your cart is empty</h2>
        <p>Add some fresh farm milk or dairy essentials to proceed with checkout.</p>
        <a routerLink="/products" class="btn btn-primary">Browse Dairy Catalog →</a>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page {
      padding: 32px 20px 60px;
    }

    .checkout-head {
      margin-bottom: 28px;

      .breadcrumb {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 600;
        margin-bottom: 6px;
        display: block;
      }

      h1 {
        font-size: 2rem;
        margin-bottom: 6px;
      }

      .secure-badge {
        font-size: 0.8rem;
        color: var(--primary);
        font-weight: 700;
      }
    }

    .checkout-grid {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 32px;
      align-items: flex-start;
    }

    .checkout-steps {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .step-card {
      padding: 24px;

      .step-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;

        .step-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--primary);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
        }

        h3 {
          font-size: 1.15rem;
        }
      }
    }

    .addresses-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .address-card {
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px;
      cursor: pointer;
      background-color: var(--bg-app);
      transition: all 0.2s ease;

      &.selected {
        border-color: var(--primary);
        background-color: var(--primary-subtle);
      }

      .addr-head {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .addr-type {
        font-size: 0.7rem;
        font-weight: 800;
        background-color: var(--primary);
        color: #ffffff;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
      }

      .select-check {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--primary);
      }

      p {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin: 4px 0;
      }

      .instructions {
        font-size: 0.75rem;
        color: var(--text-body);
        font-style: italic;
      }
    }

    .slot-select-row {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .slots-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .slot-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;

      &.active {
        border-color: var(--primary);
        background-color: var(--primary-subtle);
      }

      .slot-icon { font-size: 1.4rem; }

      .slot-meta {
        display: flex;
        flex-direction: column;
        font-size: 0.85rem;
        span { font-size: 0.75rem; color: var(--text-muted); }
      }
    }

    .payment-options-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .pay-method-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;

      &.selected {
        border-color: var(--primary);
        background-color: var(--cream-bg);
      }

      .pay-icon { font-size: 1.5rem; }

      .pay-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        font-size: 0.875rem;

        span { font-size: 0.75rem; color: var(--text-muted); }
      }

      .rec-badge {
        font-size: 0.7rem;
        font-weight: 800;
        background-color: var(--gold-badge);
        color: var(--butter-dark);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
      }
    }

    /* Order Summary Sidebar */
    .order-summary-sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .coupon-card {
      padding: 20px;

      h4 { margin-bottom: 12px; font-size: 0.95rem; }

      .coupon-input-group {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;

        .coupon-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--border-subtle);
          font-size: 0.85rem;
          text-transform: uppercase;
        }
      }

      .coupon-success-msg {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--success);
      }

      .suggested-coupons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;

        .sugg-tag {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background-color: var(--bg-app);
          border: 1px dashed var(--primary);
          color: var(--primary);
          cursor: pointer;
        }
      }
    }

    .items-card {
      padding: 20px;

      h4 { margin-bottom: 16px; font-size: 0.95rem; }
    }

    .items-mini-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
      max-height: 240px;
      overflow-y: auto;
    }

    .mini-item {
      display: flex;
      align-items: center;
      gap: 10px;

      .mini-thumb {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-sm);
        object-fit: cover;
      }

      .mini-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        font-size: 0.85rem;
        span { font-size: 0.725rem; color: var(--text-muted); }
      }

      .mini-price { font-size: 0.9rem; }
    }

    .bill-ledger {
      border-top: 1px solid var(--border-subtle);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;

      .ledger-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;

        .free { color: var(--success); font-weight: 700; }
        .discount-label, .discount-amt { color: var(--success); font-weight: 700; }

        &.total-row {
          border-top: 1px solid var(--border-subtle);
          padding-top: 10px;
          margin-top: 6px;
          font-size: 1.15rem;
          font-weight: 800;

          .grand-total { color: var(--primary); }
        }
      }
    }

    .place-order-btn {
      padding: 14px;
      font-size: 1.05rem;
    }

    .empty-checkout {
      text-align: center;
      padding: 60px 20px;
      .empty-icon { font-size: 4rem; margin-bottom: 12px; }
      h2 { font-size: 1.5rem; margin-bottom: 8px; }
      p { color: var(--text-muted); margin-bottom: 20px; }
    }

    @media (max-width: 900px) {
      .checkout-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CheckoutComponent implements OnInit {
  cartService = inject(CartService);
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  addresses = signal<Address[]>([]);
  selectedAddressId = signal<string>('addr_001');

  deliverySlot = signal<DeliverySlot>('MORNING_5_30_7_30');
  deliveryDate = '';
  minDeliveryDate = '';

  selectedPayMethod = 'WALLET';
  paymentMethod = signal<PaymentMethod>('WALLET');

  couponCode = '';
  isCouponApplied = signal<boolean>(false);
  discountAmount = signal<number>(0);

  isPlacingOrder = signal<boolean>(false);

  ngOnInit() {
    const tomorrow = addDays(new Date(), 1);
    this.minDeliveryDate = format(tomorrow, 'yyyy-MM-dd');
    this.deliveryDate = this.minDeliveryDate;

    this.loadAddresses();
  }

  loadAddresses() {
    this.api.get<Address[]>('users/addresses').subscribe({
      next: (addrs) => {
        this.addresses.set(addrs || []);
        if (addrs && addrs.length > 0) {
          const def = addrs.find((a) => a.isDefault);
          this.selectedAddressId.set(def ? def.id : addrs[0].id);
        }
      },
    });
  }

  onPaymentMethodChange(method: PaymentMethod) {
    this.paymentMethod.set(method);
  }

  setAndApplyCoupon(code: string) {
    this.couponCode = code;
    this.applyCoupon();
  }

  applyCoupon() {
    if (!this.couponCode.trim()) return;

    this.api.get<{ valid: boolean; discountAmount: number; description: string }>('coupons/validate', {
      code: this.couponCode.trim(),
      subtotal: this.cartService.cartSignal().subtotal,
    }).subscribe({
      next: (res) => {
        this.isCouponApplied.set(true);
        this.discountAmount.set(res.discountAmount || 0);
        this.toast.success(`🎉 ${res.description || 'Coupon applied successfully!'}`);
      },
      error: () => {},
    });
  }

  removeCoupon() {
    this.couponCode = '';
    this.isCouponApplied.set(false);
    this.discountAmount.set(0);
    this.toast.info('Coupon removed.');
  }

  deliveryFee(): number {
    return this.cartService.cartSignal().subtotal > 199 ? 0 : 25;
  }

  finalTotal(): number {
    const subtotal = this.cartService.cartSignal().subtotal;
    const discount = this.discountAmount();
    const fee = this.deliveryFee();
    return Math.max(0, subtotal - discount + fee);
  }

  placeOrder() {
    this.isPlacingOrder.set(true);

    const itemsPayload = this.cartService.cartSignal().items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));

    const payload = {
      items: itemsPayload,
      addressId: this.selectedAddressId(),
      deliveryDate: this.deliveryDate,
      deliverySlot: this.deliverySlot(),
      paymentMethod: this.paymentMethod(),
      couponCode: this.isCouponApplied() ? this.couponCode : undefined,
    };

    this.api.post<Order>('orders', payload).subscribe({
      next: (order) => {
        this.isPlacingOrder.set(false);
        this.cartService.clearCart();
        this.toast.success(`🎉 Order #${order.orderNumber} placed successfully!`);

        // Confetti celebration
        try {
          const launchConfetti = (confetti as any).default || (confetti as any);
          launchConfetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {}

        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.isPlacingOrder.set(false);
      },
    });
  }
}
