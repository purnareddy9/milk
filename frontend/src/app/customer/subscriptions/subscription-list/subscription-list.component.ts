import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { Subscription, SubscriptionDelivery } from '../../../core/models';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../../shared/pipes/milk-unit.pipe';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="container subscriptions-page">
      <!-- Header -->
      <div class="page-head">
        <div>
          <span class="breadcrumb">Account / Milk Subscriptions</span>
          <h1>My Daily Milk Subscriptions</h1>
          <p class="page-desc">
            Manage your daily morning deliveries, pause for vacations, skip dates, or change quantities anytime.
          </p>
        </div>
        <a routerLink="/products" class="btn btn-gold">
          + Add New Subscription
        </a>
      </div>

      <!-- Active Subscriptions List -->
      <div class="subs-list-section" *ngIf="subscriptions().length > 0">
        <div class="subs-grid">
          <div *ngFor="let sub of subscriptions()" class="sub-card card card-hover" [class.paused]="sub.status === 'PAUSED'">
            <!-- Card Header -->
            <div class="sub-card-top">
              <div class="prod-identity">
                <img [src]="sub.product?.imageUrl || 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=400&auto=format&fit=crop&q=80'" (error)="onImgError($event)" [alt]="sub.product?.name" class="sub-prod-img" />
                <div>
                  <span class="status-pill" [class.active]="sub.status === 'ACTIVE'" [class.paused]="sub.status === 'PAUSED'">
                    {{ sub.status }}
                  </span>
                  <h3>{{ sub.product.name }}</h3>
                  <span class="sub-specs">{{ sub.quantity }}x {{ sub.product.unit | milkUnit }} · {{ formatFrequency(sub.frequency) }}</span>
                </div>
              </div>

              <div class="sub-price-box">
                <span class="daily-price">{{ sub.dailyPrice | inrCurrency }}<small>/day</small></span>
                <span class="slot-badge">🌅 5:30 AM – 7:30 AM</span>
              </div>
            </div>

            <!-- Next Delivery & Address Details -->
            <div class="sub-details-grid">
              <div class="detail-item">
                <span class="label">Next Scheduled Delivery</span>
                <strong class="val highlight">{{ getNextDeliveryDate(sub) }}</strong>
              </div>

              <div class="detail-item">
                <span class="label">Delivery Address</span>
                <strong class="val">{{ sub.address?.houseFlat }}, {{ sub.address?.area }}</strong>
              </div>

              <div class="detail-item" *ngIf="sub.status === 'PAUSED'">
                <span class="label">Paused Range</span>
                <strong class="val paused-text">{{ sub.pauseStartDate }} to {{ sub.pauseEndDate }}</strong>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="sub-actions-bar">
              <!-- Skip Next Delivery Button -->
              <button
                class="btn btn-light btn-sm"
                *ngIf="sub.status === 'ACTIVE'"
                (click)="skipNextDelivery(sub)"
              >
                ⏭️ Skip Tomorrow
              </button>

              <!-- Pause Button -->
              <button
                class="btn btn-light btn-sm"
                *ngIf="sub.status === 'ACTIVE'"
                (click)="openPauseModal(sub)"
              >
                ⏸️ Pause
              </button>

              <!-- Resume Button -->
              <button
                class="btn btn-primary btn-sm"
                *ngIf="sub.status === 'PAUSED'"
                (click)="resumeSubscription(sub)"
              >
                ▶️ Resume Deliveries
              </button>

              <!-- Edit Quantity -->
              <button
                class="btn btn-light btn-sm"
                (click)="openEditQtyModal(sub)"
              >
                ✏️ Change Qty ({{ sub.quantity }})
              </button>

              <!-- Cancel -->
              <button
                class="btn btn-danger btn-sm cancel-btn"
                (click)="cancelSubscription(sub)"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-subs card" *ngIf="subscriptions().length === 0">
        <span class="empty-icon">🥛</span>
        <h2>No Active Milk Subscriptions</h2>
        <p>Get pure organic cow and buffalo milk delivered automatically to your door every single morning.</p>
        <a routerLink="/products" class="btn btn-gold btn-lg">Browse Milk & Start Subscription →</a>
      </div>

      <!-- 30-Day Interactive Delivery Calendar -->
      <div class="calendar-section card" *ngIf="subscriptions().length > 0">
        <div class="cal-header">
          <div>
            <h2>📅 30-Day Delivery Calendar Feed</h2>
            <p>Click on any upcoming day to skip or modify your delivery.</p>
          </div>
          <div class="cal-legend">
            <span class="legend-item"><span class="dot green"></span> Delivered</span>
            <span class="legend-item"><span class="dot blue"></span> Scheduled</span>
            <span class="legend-item"><span class="dot yellow"></span> Paused</span>
            <span class="legend-item"><span class="dot gray"></span> Skipped</span>
          </div>
        </div>

        <div class="calendar-grid">
          <div
            *ngFor="let day of calendarDays()"
            class="cal-day-cell"
            [class.today]="day.isToday"
            [class.has-delivery]="day.deliveries.length > 0"
            [class.skipped]="isDaySkipped(day)"
            [class.delivered]="isDayDelivered(day)"
          >
            <div class="day-head">
              <span class="day-name">{{ day.dayName }}</span>
              <span class="day-num" [class.today-badge]="day.isToday">{{ day.dayNum }}</span>
            </div>

            <div class="day-deliveries" *ngIf="day.deliveries.length > 0">
              <div
                *ngFor="let deliv of day.deliveries"
                class="delivery-tag"
                [class.tag-delivered]="deliv.status === 'DELIVERED'"
                [class.tag-scheduled]="deliv.status === 'SCHEDULED'"
                [class.tag-skipped]="deliv.status === 'SKIPPED'"
                [class.tag-paused]="deliv.status === 'PAUSED'"
                (click)="onCalendarDayClick(deliv, day.dateStr)"
              >
                <span class="tag-status">
                  {{ deliv.status === 'DELIVERED' ? '✓' : deliv.status === 'SKIPPED' ? '✕' : deliv.status === 'PAUSED' ? '⏸' : '🥛' }}
                </span>
                <span class="tag-label">{{ deliv.quantity }}x Milk</span>
              </div>
            </div>

            <div class="no-delivery" *ngIf="day.deliveries.length === 0">
              <span>—</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pause Modal -->
      <div class="modal-backdrop" *ngIf="isPauseModalOpen">
        <div class="modal-dialog small">
          <div class="modal-header">
            <h3>⏸️ Pause Subscription</h3>
            <button class="close-btn" (click)="isPauseModalOpen = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              Going on vacation? Pause deliveries temporarily. They will automatically resume after the end date.
            </p>
            <div class="form-group">
              <label>Pause From Date</label>
              <input type="date" [(ngModel)]="pauseStartDate" class="form-control" />
            </div>
            <div class="form-group">
              <label>Pause Until Date</label>
              <input type="date" [(ngModel)]="pauseEndDate" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" (click)="isPauseModalOpen = false">Cancel</button>
            <button class="btn btn-primary" (click)="submitPause()">Confirm Pause</button>
          </div>
        </div>
      </div>

      <!-- Edit Quantity Modal -->
      <div class="modal-backdrop" *ngIf="isQtyModalOpen">
        <div class="modal-dialog small">
          <div class="modal-header">
            <h3>✏️ Change Daily Quantity</h3>
            <button class="close-btn" (click)="isQtyModalOpen = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">Adjust the number of milk packets delivered every morning.</p>
            <div class="qty-stepper large center">
              <button (click)="newQty = newQty > 1 ? newQty - 1 : 1">−</button>
              <span class="qty-val">{{ newQty }}</span>
              <button (click)="newQty = newQty + 1">+</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" (click)="isQtyModalOpen = false">Cancel</button>
            <button class="btn btn-primary" (click)="submitQty()">Save Quantity</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subscriptions-page {
      padding: 32px 20px 60px;
    }

    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;

      .breadcrumb {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 600;
        margin-bottom: 6px;
        display: block;
      }

      h1 { font-size: 2rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); max-width: 620px; font-size: 0.95rem; }
    }

    .subs-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 40px;
    }

    .sub-card {
      padding: 24px;
      border: 1.5px solid var(--border-subtle);

      &.paused {
        opacity: 0.85;
        background-color: #fafbf9;
        border-style: dashed;
      }
    }

    .sub-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 16px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .prod-identity {
      display: flex;
      align-items: center;
      gap: 16px;

      .sub-prod-img {
        width: 64px;
        height: 64px;
        border-radius: var(--radius-md);
        object-fit: cover;
      }

      .status-pill {
        font-size: 0.68rem;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        text-transform: uppercase;
        display: inline-block;
        margin-bottom: 4px;

        &.active {
          background-color: var(--success-bg);
          color: var(--success);
        }

        &.paused {
          background-color: var(--warning-bg);
          color: var(--warning);
        }
      }

      h3 {
        font-size: 1.15rem;
        margin-bottom: 2px;
      }

      .sub-specs {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
    }

    .sub-price-box {
      text-align: right;

      .daily-price {
        font-size: 1.3rem;
        font-weight: 800;
        color: var(--primary);
        display: block;

        small {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }

      .slot-badge {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--butter-dark);
        background-color: var(--cream-surface);
        padding: 3px 8px;
        border-radius: var(--radius-sm);
      }
    }

    .sub-details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
      background-color: var(--bg-app);
      padding: 14px;
      border-radius: var(--radius-md);

      .detail-item {
        display: flex;
        flex-direction: column;

        .label {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 2px;
        }

        .val {
          font-size: 0.9rem;
          color: var(--text-main);

          &.highlight {
            color: var(--primary);
          }

          &.paused-text {
            color: var(--warning);
          }
        }
      }
    }

    .sub-actions-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      .cancel-btn {
        margin-left: auto;
      }
    }

    .empty-subs {
      text-align: center;
      padding: 60px 20px;

      .empty-icon { font-size: 4rem; margin-bottom: 12px; }
      h2 { font-size: 1.5rem; margin-bottom: 8px; }
      p { color: var(--text-muted); margin-bottom: 24px; }
    }

    /* Calendar Section */
    .calendar-section {
      padding: 28px;
      margin-top: 32px;

      .cal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 12px;

        h2 { font-size: 1.3rem; margin-bottom: 4px; }
        p { font-size: 0.85rem; color: var(--text-muted); }
      }

      .cal-legend {
        display: flex;
        gap: 16px;
        font-size: 0.78rem;
        font-weight: 600;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;

          &.green { background-color: var(--success); }
          &.blue { background-color: var(--sky-blue); }
          &.yellow { background-color: var(--warning); }
          &.gray { background-color: var(--text-light); }
        }
      }
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;

      @media (max-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .cal-day-cell {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 10px;
      min-height: 85px;
      background-color: var(--bg-app);
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;

      &.today {
        border-color: var(--primary);
        background-color: var(--primary-subtle);
      }

      .day-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .day-name {
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .day-num {
        font-weight: 800;
        font-size: 0.85rem;

        &.today-badge {
          background-color: var(--primary);
          color: #ffffff;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }
      }

      .day-deliveries {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .delivery-tag {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 4px 6px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: transform 0.15s ease;

        &:hover { transform: scale(1.03); }

        &.tag-delivered {
          background-color: var(--success-bg);
          color: var(--success);
        }

        &.tag-scheduled {
          background-color: var(--sky-subtle);
          color: var(--sky-blue);
        }

        &.tag-skipped {
          background-color: var(--border-subtle);
          color: var(--text-muted);
          text-decoration: line-through;
        }

        &.tag-paused {
          background-color: var(--warning-bg);
          color: var(--warning);
        }
      }

      .no-delivery {
        font-size: 0.8rem;
        color: var(--text-light);
        text-align: center;
        margin-top: 10px;
      }
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(20, 28, 24, 0.6);
      backdrop-filter: blur(4px);
      z-index: 9500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-dialog.small {
      max-width: 420px;
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .modal-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .qty-stepper.center {
      justify-content: center;
      margin: 20px 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    @media (max-width: 768px) {
      .sub-details-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class SubscriptionListComponent implements OnInit {
  subscriptionService = inject(SubscriptionService);
  toast = inject(ToastService);

  subscriptions = signal<Subscription[]>([]);
  deliveriesFeed = signal<SubscriptionDelivery[]>([]);
  calendarDays = signal<any[]>([]);

  // Modals state
  isPauseModalOpen = false;
  selectedSubForPause: Subscription | null = null;
  pauseStartDate = '';
  pauseEndDate = '';

  isQtyModalOpen = false;
  selectedSubForQty: Subscription | null = null;
  newQty = 1;

  ngOnInit() {
    this.loadSubscriptions();
    this.loadCalendar();
  }

  loadSubscriptions() {
    this.subscriptionService.getMySubscriptions().subscribe({
      next: (subs) => this.subscriptions.set(subs || []),
      error: () => {},
    });
  }

  loadCalendar() {
    const today = new Date();
    const startStr = format(addDays(today, -7), 'yyyy-MM-dd');
    const endStr = format(addDays(today, 23), 'yyyy-MM-dd');

    this.subscriptionService.getCalendarFeed(startStr, endStr).subscribe({
      next: (feed) => {
        this.deliveriesFeed.set(feed || []);
        this.buildCalendarGrid(feed || []);
      },
      error: () => {
        this.buildCalendarGrid([]);
      },
    });
  }

  buildCalendarGrid(feed: SubscriptionDelivery[]) {
    const days: any[] = [];
    const today = new Date();

    for (let i = -7; i <= 21; i++) {
      const d = addDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayDeliveries = feed.filter((f) => f.deliveryDate.startsWith(dateStr));

      days.push({
        date: d,
        dateStr,
        dayNum: format(d, 'd'),
        dayName: format(d, 'EEE'),
        isToday: isSameDay(d, today),
        deliveries: dayDeliveries,
      });
    }

    this.calendarDays.set(days);
  }

  formatFrequency(f: string): string {
    switch (f) {
      case 'DAILY': return 'Every Day';
      case 'ALTERNATE_DAYS': return 'Alternate Days';
      case 'WEEKDAYS': return 'Weekdays (Mon-Fri)';
      case 'CUSTOM_DAYS': return 'Custom Recurring Days';
      default: return f;
    }
  }

  getNextDeliveryDate(sub: Subscription): string {
    if (sub.status === 'PAUSED') return 'Paused';
    if (sub.deliveries && sub.deliveries.length > 0) {
      const first = sub.deliveries[0];
      return format(parseISO(first.deliveryDate), 'EEE, dd MMM');
    }
    return 'Tomorrow Morning';
  }

  isDaySkipped(day: any): boolean {
    return day.deliveries.some((d: any) => d.status === 'SKIPPED');
  }

  isDayDelivered(day: any): boolean {
    return day.deliveries.some((d: any) => d.status === 'DELIVERED');
  }

  skipNextDelivery(sub: Subscription) {
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    this.subscriptionService.skipDelivery(sub.id, tomorrowStr).subscribe({
      next: () => {
        this.toast.success(`Tomorrow's delivery skipped for ${sub.product.name}`);
        this.loadCalendar();
      },
      error: () => {},
    });
  }

  onCalendarDayClick(deliv: SubscriptionDelivery, dateStr: string) {
    if (deliv.status === 'SCHEDULED') {
      if (confirm(`Skip delivery on ${dateStr}?`)) {
        this.subscriptionService.skipDelivery(deliv.subscriptionId, dateStr).subscribe({
          next: () => {
            this.toast.success(`Delivery on ${dateStr} skipped.`);
            this.loadCalendar();
          },
        });
      }
    }
  }

  openPauseModal(sub: Subscription) {
    this.selectedSubForPause = sub;
    const tmr = addDays(new Date(), 1);
    this.pauseStartDate = format(tmr, 'yyyy-MM-dd');
    this.pauseEndDate = format(addDays(tmr, 5), 'yyyy-MM-dd');
    this.isPauseModalOpen = true;
  }

  submitPause() {
    if (this.selectedSubForPause) {
      this.subscriptionService.pauseSubscription(this.selectedSubForPause.id, this.pauseStartDate, this.pauseEndDate).subscribe({
        next: () => {
          this.toast.success(`Subscription paused until ${this.pauseEndDate}`);
          this.isPauseModalOpen = false;
          this.loadSubscriptions();
          this.loadCalendar();
        },
      });
    }
  }

  resumeSubscription(sub: Subscription) {
    this.subscriptionService.resumeSubscription(sub.id).subscribe({
      next: () => {
        this.toast.success('Subscription resumed successfully!');
        this.loadSubscriptions();
        this.loadCalendar();
      },
    });
  }

  openEditQtyModal(sub: Subscription) {
    this.selectedSubForQty = sub;
    this.newQty = sub.quantity;
    this.isQtyModalOpen = true;
  }

  submitQty() {
    if (this.selectedSubForQty) {
      this.subscriptionService.updateSubscription(this.selectedSubForQty.id, { quantity: this.newQty }).subscribe({
        next: () => {
          this.toast.success(`Quantity updated to ${this.newQty} packets daily.`);
          this.isQtyModalOpen = false;
          this.loadSubscriptions();
        },
      });
    }
  }

  cancelSubscription(sub: Subscription) {
    if (confirm(`Are you sure you want to cancel your ${sub.product.name} subscription?`)) {
      this.subscriptionService.cancelSubscription(sub.id).subscribe({
        next: () => {
          this.toast.info('Subscription has been cancelled.');
          this.loadSubscriptions();
          this.loadCalendar();
        },
      });
    }
  }

  onImgError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=400&auto=format&fit=crop&q=80';
  }
}
