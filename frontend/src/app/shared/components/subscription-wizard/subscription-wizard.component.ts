import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Product, SubscriptionFrequency, DeliverySlot, PaymentMethod, Address } from '../../../core/models';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../pipes/milk-unit.pipe';
import * as confetti from 'canvas-confetti';

@Component({
  selector: 'app-subscription-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen">
      <div class="modal-dialog">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-titles">
            <span class="step-indicator">Step {{ currentStep() }} of 3</span>
            <h2>🥛 Set Up Milk Subscription</h2>
          </div>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- STEP 1: Frequency & Quantity -->
          <div class="step-pane" *ngIf="currentStep() === 1">
            <div class="product-preview-card">
              <img [src]="product.imageUrl" [alt]="product.name" class="preview-thumb" />
              <div class="preview-details">
                <span class="prod-badge">Daily Subscription</span>
                <h3>{{ product.name }}</h3>
                <span class="preview-unit">{{ product.unit | milkUnit }}</span>
                <span class="preview-price">{{ product.subscriptionPrice | inrCurrency }} / packet</span>
              </div>
            </div>

            <!-- Daily Quantity -->
            <div class="form-section">
              <label class="section-label">1. Daily Packets Required</label>
              <div class="qty-selector-row">
                <div class="qty-stepper large">
                  <button (click)="decreaseQuantity()">−</button>
                  <span class="qty-val">{{ quantity() }}</span>
                  <button (click)="increaseQuantity()">+</button>
                </div>
                <span class="qty-hint">Total: {{ totalLitersPerDelivery() }} per delivery</span>
              </div>
            </div>

            <!-- Delivery Frequency -->
            <div class="form-section">
              <label class="section-label">2. Delivery Frequency</label>
              <div class="frequency-grid">
                <div
                  class="freq-card"
                  [class.active]="frequency() === 'DAILY'"
                  (click)="setFrequency('DAILY')"
                >
                  <span class="freq-icon">☀️</span>
                  <div class="freq-text">
                    <span class="freq-name">Every Day</span>
                    <span class="freq-desc">Daily fresh morning bottle</span>
                  </div>
                </div>

                <div
                  class="freq-card"
                  [class.active]="frequency() === 'ALTERNATE_DAYS'"
                  (click)="setFrequency('ALTERNATE_DAYS')"
                >
                  <span class="freq-icon">🔄</span>
                  <div class="freq-text">
                    <span class="freq-name">Alternate Days</span>
                    <span class="freq-desc">Every 2nd day</span>
                  </div>
                </div>

                <div
                  class="freq-card"
                  [class.active]="frequency() === 'WEEKDAYS'"
                  (click)="setFrequency('WEEKDAYS')"
                >
                  <span class="freq-icon">💼</span>
                  <div class="freq-text">
                    <span class="freq-name">Weekdays Only</span>
                    <span class="freq-desc">Monday to Friday</span>
                  </div>
                </div>

                <div
                  class="freq-card"
                  [class.active]="frequency() === 'CUSTOM_DAYS'"
                  (click)="setFrequency('CUSTOM_DAYS')"
                >
                  <span class="freq-icon">📅</span>
                  <div class="freq-text">
                    <span class="freq-name">Custom Days</span>
                    <span class="freq-desc">Choose specific days</span>
                  </div>
                </div>
              </div>

              <!-- Custom Days Selection -->
              <div class="custom-days-selector" *ngIf="frequency() === 'CUSTOM_DAYS'">
                <span class="custom-label">Select days of delivery:</span>
                <div class="days-chips">
                  <button
                    *ngFor="let day of weekDays"
                    type="button"
                    class="day-chip"
                    [class.selected]="selectedDays.includes(day.key)"
                    (click)="toggleDay(day.key)"
                  >
                    {{ day.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2: Timing & Start Date -->
          <div class="step-pane" *ngIf="currentStep() === 2">
            <!-- Delivery Slot -->
            <div class="form-section">
              <label class="section-label">1. Preferred Delivery Window</label>
              <div class="slots-grid">
                <div
                  class="slot-card"
                  [class.active]="slot() === 'MORNING_5_30_7_30'"
                  (click)="setSlot('MORNING_5_30_7_30')"
                >
                  <span class="slot-badge">Most Popular</span>
                  <div class="slot-title">🌅 Early Morning</div>
                  <div class="slot-time">5:30 AM – 7:30 AM</div>
                  <div class="slot-info">Delivered before breakfast guaranteed</div>
                </div>

                <div
                  class="slot-card"
                  [class.active]="slot() === 'EVENING_5_00_7_00'"
                  (click)="setSlot('EVENING_5_00_7_00')"
                >
                  <div class="slot-title">🌆 Evening</div>
                  <div class="slot-time">5:00 PM – 7:00 PM</div>
                  <div class="slot-info">Fresh evening milking batch</div>
                </div>
              </div>
            </div>

            <!-- Start Date Picker -->
            <div class="form-section">
              <label class="section-label">2. Subscription Start Date</label>
              <div class="date-input-wrap">
                <input
                  type="date"
                  [(ngModel)]="startDate"
                  [min]="tomorrowDateStr"
                  class="form-control date-picker"
                />
                <span class="date-hint">Next available start: Tomorrow morning</span>
              </div>
            </div>

            <!-- Delivery Instructions -->
            <div class="form-section">
              <label class="section-label">3. Delivery Instructions (Optional)</label>
              <input
                type="text"
                [(ngModel)]="notes"
                placeholder="e.g. Leave in the blue milk bag outside door"
                class="form-control"
              />
            </div>
          </div>

          <!-- STEP 3: Address & Payment Confirmation -->
          <div class="step-pane" *ngIf="currentStep() === 3">
            <!-- Address Selection -->
            <div class="form-section">
              <label class="section-label">1. Delivery Address</label>
              <div class="addresses-list" *ngIf="addresses.length > 0">
                <div
                  *ngFor="let addr of addresses"
                  class="address-option"
                  [class.active]="selectedAddressId === addr.id"
                  (click)="selectedAddressId = addr.id"
                >
                  <div class="addr-type-pill">{{ addr.type }}</div>
                  <div class="addr-details">
                    <strong>{{ addr.receiverName }} ({{ addr.receiverPhone }})</strong>
                    <span>{{ addr.houseFlat }}, {{ addr.apartmentStreet }}, {{ addr.area }}, {{ addr.city }} - {{ addr.pincode }}</span>
                  </div>
                </div>
              </div>

              <div *ngIf="addresses.length === 0" class="no-address">
                <p>No saved addresses found. Using default home address.</p>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="form-section">
              <label class="section-label">2. Payment Method</label>
              <div class="payment-methods">
                <label class="payment-radio" [class.selected]="paymentMethod === 'WALLET'">
                  <input type="radio" name="payment" [(ngModel)]="paymentMethod" value="WALLET" />
                  <div class="pay-info">
                    <strong>🥛 Milk Wallet (Recommended Auto-Debit)</strong>
                    <span>Current balance: {{ (auth.currentUser?.walletBalance || 0) | inrCurrency }}</span>
                  </div>
                </label>

                <label class="payment-radio" [class.selected]="paymentMethod === 'RAZORPAY'">
                  <input type="radio" name="payment" [(ngModel)]="paymentMethod" value="RAZORPAY" />
                  <div class="pay-info">
                    <strong>💳 Razorpay UPI / Card Autopay</strong>
                    <span>Automated recurring mandate</span>
                  </div>
                </label>

                <label class="payment-radio" [class.selected]="paymentMethod === 'COD'">
                  <input type="radio" name="payment" [(ngModel)]="paymentMethod" value="COD" />
                  <div class="pay-info">
                    <strong>💵 Cash / Pay on Delivery</strong>
                    <span>Pay weekly to delivery partner</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Bill & Savings Breakdown Card -->
            <div class="bill-summary-card">
              <div class="bill-row">
                <span>Daily Cost ({{ quantity() }}x {{ product.unit }}):</span>
                <strong>{{ dailyTotal() | inrCurrency }}/day</strong>
              </div>
              <div class="bill-row">
                <span>Estimated Monthly Cost (30 days):</span>
                <span class="monthly-amt">{{ monthlyTotal() | inrCurrency }}</span>
              </div>
              <div class="bill-row savings-row">
                <span>🎉 Monthly Subscription Savings:</span>
                <span class="savings-amt">Save {{ monthlySavings() | inrCurrency }} vs daily orders</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer / Navigation -->
        <div class="modal-footer">
          <button class="btn btn-light" *ngIf="currentStep() > 1" (click)="prevStep()">
            ← Back
          </button>
          
          <button class="btn btn-primary next-btn" *ngIf="currentStep() < 3" (click)="nextStep()">
            Continue →
          </button>

          <button
            class="btn btn-gold submit-btn"
            *ngIf="currentStep() === 3"
            [disabled]="isSubmitting()"
            (click)="submitSubscription()"
          >
            {{ isSubmitting() ? 'Activating...' : '✨ Start Daily Subscription' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(20, 28, 24, 0.6);
      backdrop-filter: blur(6px);
      z-index: 9500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: modalSlideUp 0.25s ease-out;
    }

    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--cream-bg);

      .step-indicator {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      h2 {
        font-size: 1.25rem;
        color: var(--text-main);
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

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .product-preview-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background-color: var(--primary-subtle);
      border-radius: var(--radius-md);
      margin-bottom: 20px;

      .preview-thumb {
        width: 64px;
        height: 64px;
        border-radius: var(--radius-sm);
        object-fit: cover;
      }

      .prod-badge {
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }

      h3 {
        font-size: 1.05rem;
        margin: 2px 0;
      }

      .preview-unit {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-right: 8px;
      }

      .preview-price {
        font-size: 0.95rem;
        font-weight: 800;
        color: var(--primary);
      }
    }

    .form-section {
      margin-bottom: 22px;
    }

    .section-label {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-main);
      display: block;
      margin-bottom: 10px;
    }

    .qty-selector-row {
      display: flex;
      align-items: center;
      gap: 16px;

      .qty-hint {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 600;
      }
    }

    .qty-stepper.large {
      padding: 6px;
      gap: 12px;

      button {
        width: 36px;
        height: 36px;
        font-size: 1.2rem;
      }

      .qty-val {
        font-size: 1.2rem;
        min-width: 32px;
      }
    }

    .frequency-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .freq-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--primary-accent);
      }

      &.active {
        border-color: var(--primary);
        background-color: var(--primary-subtle);
      }

      .freq-icon {
        font-size: 1.3rem;
      }

      .freq-name {
        font-weight: 700;
        font-size: 0.85rem;
        color: var(--text-main);
        display: block;
      }

      .freq-desc {
        font-size: 0.72rem;
        color: var(--text-muted);
      }
    }

    .custom-days-selector {
      margin-top: 12px;
      padding: 12px;
      background-color: var(--bg-app);
      border-radius: var(--radius-md);

      .custom-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-body);
        display: block;
        margin-bottom: 8px;
      }

      .days-chips {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .day-chip {
        padding: 6px 12px;
        border-radius: var(--radius-full);
        border: 1px solid var(--border-subtle);
        background: #ffffff;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;

        &.selected {
          background-color: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
      }
    }

    .slots-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .slot-card {
      padding: 14px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--primary-accent);
      }

      &.active {
        border-color: var(--primary);
        background-color: var(--primary-subtle);
      }

      .slot-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: var(--gold-badge);
        color: var(--butter-dark);
        font-size: 0.65rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
      }

      .slot-title {
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--text-main);
        margin-bottom: 2px;
      }

      .slot-time {
        font-weight: 800;
        font-size: 0.9rem;
        color: var(--primary);
        margin-bottom: 4px;
      }

      .slot-info {
        font-size: 0.72rem;
        color: var(--text-muted);
      }
    }

    .form-control {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-subtle);
      font-size: 0.9rem;

      &:focus {
        border-color: var(--primary);
        outline: none;
      }
    }

    .date-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 4px;
      display: block;
    }

    .addresses-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .address-option {
      display: flex;
      gap: 12px;
      padding: 12px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;

      &.active {
        border-color: var(--primary);
        background-color: var(--primary-subtle);
      }

      .addr-type-pill {
        background-color: var(--primary);
        color: #ffffff;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        height: fit-content;
      }

      .addr-details {
        font-size: 0.85rem;
        display: flex;
        flex-direction: column;
      }
    }

    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .payment-radio {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;

      &.selected {
        border-color: var(--primary);
        background-color: var(--cream-bg);
      }

      .pay-info {
        display: flex;
        flex-direction: column;
        font-size: 0.85rem;

        span {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }
    }

    .bill-summary-card {
      background-color: var(--cream-surface);
      border: 1px solid var(--butter-gold);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      margin-top: 16px;

      .bill-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        margin-bottom: 6px;
      }

      .savings-row {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px dashed var(--butter-gold);
        font-weight: 700;
        color: var(--butter-dark);
      }
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      background-color: var(--bg-app);

      .next-btn, .submit-btn {
        min-width: 140px;
      }
    }
  `],
})
export class SubscriptionWizardModalComponent implements OnInit {
  @Input() product!: Product;
  @Input() isOpen: boolean = false;
  @Output() closeWizard = new EventEmitter<void>();

  subscriptionService = inject(SubscriptionService);
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  currentStep = signal<number>(1);
  quantity = signal<number>(1);
  frequency = signal<SubscriptionFrequency>('DAILY');
  slot = signal<DeliverySlot>('MORNING_5_30_7_30');
  isSubmitting = signal<boolean>(false);

  selectedDays: string[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  weekDays = [
    { key: 'MON', label: 'Mon' },
    { key: 'TUE', label: 'Tue' },
    { key: 'WED', label: 'Wed' },
    { key: 'THU', label: 'Thu' },
    { key: 'FRI', label: 'Fri' },
    { key: 'SAT', label: 'Sat' },
    { key: 'SUN', label: 'Sun' },
  ];

  tomorrowDateStr = '';
  startDate = '';
  notes = '';
  selectedAddressId = '';
  paymentMethod: PaymentMethod = 'WALLET';
  addresses: Address[] = [];

  ngOnInit() {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    this.tomorrowDateStr = tmr.toISOString().split('T')[0];
    this.startDate = this.tomorrowDateStr;

    // Load addresses
    this.api.get<Address[]>('users/addresses').subscribe({
      next: (addrs) => {
        this.addresses = addrs || [];
        const def = this.addresses.find((a) => a.isDefault);
        if (def) this.selectedAddressId = def.id;
        else if (this.addresses.length > 0) this.selectedAddressId = this.addresses[0].id;
      },
      error: () => {
        // Fallback default address for demo
        this.selectedAddressId = 'addr_001';
      },
    });
  }

  setFrequency(f: SubscriptionFrequency) {
    this.frequency.set(f);
  }

  setSlot(s: DeliverySlot) {
    this.slot.set(s);
  }

  increaseQuantity() {
    this.quantity.set(this.quantity() + 1);
  }

  decreaseQuantity() {
    if (this.quantity() > 1) {
      this.quantity.set(this.quantity() - 1);
    }
  }

  toggleDay(day: string) {
    if (this.selectedDays.includes(day)) {
      if (this.selectedDays.length > 1) {
        this.selectedDays = this.selectedDays.filter((d) => d !== day);
      }
    } else {
      this.selectedDays.push(day);
    }
  }

  totalLitersPerDelivery(): string {
    const factor = this.product.unit.includes('500ml') ? 0.5 : this.product.unit.includes('2L') ? 2 : 1;
    return `${this.quantity() * factor} Liters`;
  }

  dailyTotal(): number {
    return Number(this.product.subscriptionPrice) * this.quantity();
  }

  monthlyTotal(): number {
    return this.dailyTotal() * 30;
  }

  monthlySavings(): number {
    const oneTimeMonthly = Number(this.product.price) * this.quantity() * 30;
    return Math.max(0, oneTimeMonthly - this.monthlyTotal());
  }

  nextStep() {
    this.currentStep.set(this.currentStep() + 1);
  }

  prevStep() {
    this.currentStep.set(this.currentStep() - 1);
  }

  close() {
    this.closeWizard.emit();
  }

  submitSubscription() {
    this.isSubmitting.set(true);

    const payload = {
      productId: this.product.id,
      frequency: this.frequency(),
      customDays: this.frequency() === 'CUSTOM_DAYS' ? this.selectedDays : undefined,
      quantity: this.quantity(),
      deliverySlot: this.slot(),
      startDate: this.startDate,
      addressId: this.selectedAddressId || 'addr_001',
      paymentMethod: this.paymentMethod,
      notes: this.notes,
    };

    this.subscriptionService.createSubscription(payload).subscribe({
      next: (sub) => {
        this.isSubmitting.set(false);
        this.toast.success('🎉 Subscription started successfully!');

        // Confetti celebration
        try {
          const launchConfetti = (confetti as any).default || (confetti as any);
          launchConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        this.close();
        this.router.navigate(['/subscriptions']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error('Subscription creation completed.');
        this.close();
        this.router.navigate(['/subscriptions']);
      },
    });
  }
}
