import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Subscription } from '../../core/models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../shared/pipes/milk-unit.pipe';
import { format, parseISO } from 'date-fns';

@Component({
  selector: 'app-seller-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="seller-subs-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Subscriptions</span>
          <h1>📅 Customer Subscriptions & MRR Hub</h1>
          <p class="page-desc">Master list of recurring milk subscriptions, pause overrides, and monthly revenue analytics.</p>
        </div>
      </div>

      <!-- MRR & Metrics Bar -->
      <div class="metrics-bar-grid" *ngIf="metrics() as m">
        <div class="metric-card card">
          <span class="metric-icon">🥛</span>
          <div class="metric-info">
            <span class="m-label">Active Subscribers</span>
            <strong class="m-val">{{ m.activeSubscribers }}</strong>
          </div>
        </div>

        <div class="metric-card card">
          <span class="metric-icon">💰</span>
          <div class="metric-info">
            <span class="m-label">Monthly Recurring Revenue (MRR)</span>
            <strong class="m-val">{{ m.monthlyRecurringRevenue | inrCurrency }}</strong>
          </div>
        </div>

        <div class="metric-card card">
          <span class="metric-icon">⏸️</span>
          <div class="metric-info">
            <span class="m-label">Paused Subscribers</span>
            <strong class="m-val">{{ m.pausedSubscribers }}</strong>
          </div>
        </div>

        <div class="metric-card card">
          <span class="metric-icon">📦</span>
          <div class="metric-info">
            <span class="m-label">Estimated Daily Packets</span>
            <strong class="m-val">{{ m.estimatedDailyPackets }} Pkts/Day</strong>
          </div>
        </div>
      </div>

      <!-- Filter Row -->
      <div class="filter-row card">
        <div class="status-chips">
          <button class="chip" [class.active]="selectedStatus === ''" (click)="setStatus('')">All Subscriptions</button>
          <button class="chip" [class.active]="selectedStatus === 'ACTIVE'" (click)="setStatus('ACTIVE')">Active</button>
          <button class="chip" [class.active]="selectedStatus === 'PAUSED'" (click)="setStatus('PAUSED')">Paused</button>
          <button class="chip" [class.active]="selectedStatus === 'CANCELLED'" (click)="setStatus('CANCELLED')">Cancelled</button>
        </div>

        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange()"
          placeholder="Search subscriber name, phone, product..."
          class="search-input"
        />
      </div>

      <!-- Subscriptions Table -->
      <div class="table-card card">
        <div class="table-responsive" *ngIf="subscriptions().length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product Variant</th>
                <th>Frequency</th>
                <th>Daily Quantity</th>
                <th>Delivery Window</th>
                <th>Address</th>
                <th>Daily Price</th>
                <th>Status</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sub of subscriptions()">
                <td>
                  <strong>{{ sub.user?.name }}</strong>
                  <span class="sub-phone">📞 {{ sub.user?.phone }}</span>
                </td>
                <td class="prod-cell">
                  <img [src]="sub.product.imageUrl" [alt]="sub.product.name" class="mini-thumb" />
                  <strong>{{ sub.product.name }}</strong>
                </td>
                <td><span class="freq-tag">{{ formatFreq(sub.frequency) }}</span></td>
                <td><strong class="qty-num">{{ sub.quantity }}x ({{ sub.product.unit | milkUnit }})</strong></td>
                <td><span class="slot-tag">🌅 5:30 – 7:30 AM</span></td>
                <td><span class="addr-tag">{{ sub.address?.houseFlat }}, {{ sub.address?.area }}</span></td>
                <td><strong class="daily-amt">{{ sub.dailyPrice | inrCurrency }}</strong></td>
                <td>
                  <span class="status-pill {{ sub.status.toLowerCase() }}">{{ sub.status }}</span>
                </td>
                <td>
                  <button class="btn btn-light btn-sm" *ngIf="sub.status === 'ACTIVE'" (click)="pauseSub(sub)">Pause</button>
                  <button class="btn btn-primary btn-sm" *ngIf="sub.status === 'PAUSED'" (click)="resumeSub(sub)">Resume</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-subs-page { display: flex; flex-direction: column; gap: 24px; }
    .page-head {
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 1.8rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .metrics-bar-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .metric-card {
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;

      .metric-icon { font-size: 2rem; }
      .metric-info { display: flex; flex-direction: column; }
      .m-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
      .m-val { font-size: 1.4rem; font-weight: 800; color: var(--text-main); }
    }

    .filter-row {
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      .status-chips { display: flex; gap: 6px; }
      .chip {
        padding: 6px 12px;
        border-radius: var(--radius-full);
        border: 1px solid var(--border-subtle);
        background: #ffffff;
        font-size: 0.825rem;
        cursor: pointer;

        &.active {
          background-color: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
      }

      .search-input {
        padding: 8px 14px;
        border-radius: var(--radius-full);
        border: 1.5px solid var(--border-subtle);
        font-size: 0.85rem;
        min-width: 260px;
      }
    }

    .table-card { padding: 0; overflow: hidden; }
    .table-responsive { overflow-x: auto; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        padding: 12px 16px;
        background-color: var(--bg-app);
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        border-bottom: 1.5px solid var(--border-subtle);
      }

      td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border-subtle);
        font-size: 0.875rem;
      }
    }

    .sub-phone { font-size: 0.75rem; color: var(--text-muted); display: block; }
    .prod-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      .mini-thumb { width: 36px; height: 36px; border-radius: var(--radius-sm); object-fit: cover; }
    }
    .freq-tag { font-size: 0.8rem; font-weight: 600; color: var(--text-body); }
    .qty-num { font-size: 0.9rem; color: var(--primary); }
    .slot-tag { font-size: 0.75rem; font-weight: 700; color: var(--butter-dark); }
    .addr-tag { font-size: 0.8rem; color: var(--text-body); max-width: 160px; display: block; }
    .daily-amt { font-size: 0.95rem; color: var(--text-main); }

    .status-pill {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      text-transform: uppercase;

      &.active { background-color: var(--success-bg); color: var(--success); }
      &.paused { background-color: var(--warning-bg); color: var(--warning); }
      &.cancelled { background-color: var(--danger-bg); color: var(--danger); }
    }

    @media (max-width: 1024px) {
      .metrics-bar-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class SellerSubscriptionsComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);

  subscriptions = signal<Subscription[]>([]);
  metrics = signal<any>(null);

  selectedStatus = '';
  searchQuery = '';

  ngOnInit() {
    this.loadSubscriptions();
  }

  loadSubscriptions() {
    this.api.get<{ subscriptions: Subscription[]; metrics: any }>('subscriptions/admin/all', {
      status: this.selectedStatus || undefined,
      search: this.searchQuery || undefined,
    }).subscribe({
      next: (res) => {
        this.subscriptions.set(res?.subscriptions || []);
        this.metrics.set(res?.metrics || {});
      },
    });
  }

  setStatus(s: string) {
    this.selectedStatus = s;
    this.loadSubscriptions();
  }

  onSearchChange() {
    this.loadSubscriptions();
  }

  formatFreq(f: string): string {
    switch (f) {
      case 'DAILY': return 'Daily';
      case 'ALTERNATE_DAYS': return 'Alternate';
      case 'WEEKDAYS': return 'Weekdays';
      default: return f;
    }
  }

  pauseSub(sub: Subscription) {
    const tmr = format(new Date(), 'yyyy-MM-dd');
    this.api.post(`subscriptions/${sub.id}/pause`, { pauseStartDate: tmr, pauseEndDate: tmr }).subscribe({
      next: () => {
        this.toast.success('Subscription paused by admin');
        this.loadSubscriptions();
      },
    });
  }

  resumeSub(sub: Subscription) {
    this.api.post(`subscriptions/${sub.id}/resume`, {}).subscribe({
      next: () => {
        this.toast.success('Subscription resumed by admin');
        this.loadSubscriptions();
      },
    });
  }
}
