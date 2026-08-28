import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-seller-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe],
  template: `
    <div class="seller-customers-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Customers</span>
          <h1>👥 Customer 360 CRM & Subscriber Insights</h1>
          <p class="page-desc">Track customer lifetime value (LTV), active recurring subscriptions, wallet balances, and delivery addresses.</p>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="table-card card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Active Subscriptions</th>
                <th>Total Orders</th>
                <th>Lifetime Spent (LTV)</th>
                <th>Milk Wallet</th>
                <th>Loyalty Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of customers()">
                <td class="cust-cell">
                  <img [src]="c.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'" alt="Avatar" class="avatar-sm" />
                  <strong>{{ c.name }}</strong>
                </td>
                <td>
                  <span>📞 {{ c.phone }}</span>
                  <span class="email-sub">{{ c.email }}</span>
                </td>
                <td>
                  <span class="sub-count-badge" [class.has-sub]="c.activeSubscriptionsCount > 0">
                    {{ c.activeSubscriptionsCount > 0 ? c.activeSubscriptionsCount + ' Active Sub' : 'No Sub' }}
                  </span>
                </td>
                <td><strong>{{ c.totalOrders }}</strong></td>
                <td><strong class="ltv-amt">{{ c.lifetimeValue | inrCurrency }}</strong></td>
                <td><span>{{ c.walletBalance | inrCurrency }}</span></td>
                <td><span class="badge badge-gold">{{ c.loyaltyPoints }} pts</span></td>
                <td>
                  <button class="btn btn-light btn-sm" (click)="viewCustomer(c)">
                    👤 360 View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Customer 360 Modal -->
      <div class="modal-backdrop" *ngIf="selectedCustomer">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>👤 Customer 360: {{ selectedCustomer.name }}</h3>
            <button class="close-btn" (click)="selectedCustomer = null">✕</button>
          </div>
          <div class="modal-body">
            <div class="summary-pills-row">
              <div class="pill">
                <span>LTV:</span>
                <strong>{{ selectedCustomer.lifetimeValue | inrCurrency }}</strong>
              </div>
              <div class="pill">
                <span>Orders:</span>
                <strong>{{ selectedCustomer.totalOrders }}</strong>
              </div>
              <div class="pill">
                <span>Wallet:</span>
                <strong>{{ selectedCustomer.walletBalance | inrCurrency }}</strong>
              </div>
            </div>

            <div class="addr-box">
              <h4>Default Delivery Address:</h4>
              <p *ngIf="selectedCustomer.defaultAddress">
                {{ selectedCustomer.defaultAddress.houseFlat }}, {{ selectedCustomer.defaultAddress.area }}, {{ selectedCustomer.defaultAddress.city }}
              </p>
              <p *ngIf="!selectedCustomer.defaultAddress">Sector 14, Gurugram</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" (click)="selectedCustomer = null">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-customers-page { display: flex; flex-direction: column; gap: 24px; }
    .page-head {
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 1.8rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
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

    .cust-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      .avatar-sm { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
    }

    .email-sub { font-size: 0.75rem; color: var(--text-muted); display: block; }

    .sub-count-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      background-color: var(--bg-app);
      color: var(--text-muted);

      &.has-sub {
        background-color: var(--primary-subtle);
        color: var(--primary);
      }
    }

    .ltv-amt { font-size: 1rem; color: var(--primary); }

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

    .modal-dialog {
      background: #ffffff;
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 480px;
      padding: 24px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .summary-pills-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 16px;

      .pill {
        background-color: var(--bg-app);
        padding: 10px;
        border-radius: var(--radius-md);
        display: flex;
        flex-direction: column;
        text-align: center;
        span { font-size: 0.75rem; color: var(--text-muted); }
        strong { font-size: 1.1rem; color: var(--primary); }
      }
    }

    .addr-box {
      background-color: var(--bg-app);
      padding: 12px;
      border-radius: var(--radius-md);
      h4 { font-size: 0.85rem; margin-bottom: 4px; }
      p { font-size: 0.85rem; color: var(--text-body); }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  `],
})
export class SellerCustomersComponent implements OnInit {
  api = inject(ApiService);
  customers = signal<any[]>([]);
  selectedCustomer: any = null;

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.api.get<{ customers: any[] }>('customers').subscribe({
      next: (res) => this.customers.set(res?.customers || []),
    });
  }

  viewCustomer(c: any) {
    this.selectedCustomer = c;
  }
}
