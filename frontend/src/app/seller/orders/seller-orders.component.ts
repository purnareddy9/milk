import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Order, OrderStatus } from '../../core/models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../shared/pipes/milk-unit.pipe';
import { format, parseISO } from 'date-fns';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="seller-orders-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Orders Fulfillment</span>
          <h1>📦 Customer Orders & Dispatch Management</h1>
          <p class="page-desc">Track one-time instant orders, assign delivery routes, and update fulfillment stages.</p>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="filters-card card">
        <div class="status-tabs">
          <button
            class="tab-btn"
            [class.active]="selectedStatus === ''"
            (click)="setStatus('')"
          >
            All Orders ({{ totalCount() }})
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedStatus === 'PENDING'"
            (click)="setStatus('PENDING')"
          >
            Pending ({{ counts()?.pending || 0 }})
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedStatus === 'CONFIRMED'"
            (click)="setStatus('CONFIRMED')"
          >
            Confirmed
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedStatus === 'PREPARING'"
            (click)="setStatus('PREPARING')"
          >
            Packing ({{ counts()?.preparing || 0 }})
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedStatus === 'OUT_FOR_DELIVERY'"
            (click)="setStatus('OUT_FOR_DELIVERY')"
          >
            Out for Delivery ({{ counts()?.outForDelivery || 0 }})
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedStatus === 'DELIVERED'"
            (click)="setStatus('DELIVERED')"
          >
            Delivered ({{ counts()?.delivered || 0 }})
          </button>
        </div>

        <div class="search-input-wrap">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Search order #, customer name, phone..."
            class="search-field"
          />
          <span class="search-icon">🔍</span>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="orders-table-card card">
        <div class="table-responsive" *ngIf="orders().length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items Ordered</th>
                <th>Delivery Window</th>
                <th>Address</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ord of orders()">
                <td>
                  <strong class="ord-num">{{ ord.orderNumber }}</strong>
                  <span class="ord-time">{{ formatDate(ord.createdAt) }}</span>
                </td>

                <td class="customer-cell">
                  <strong>{{ ord.user?.name || 'Customer' }}</strong>
                  <span class="cust-phone">📞 {{ ord.user?.phone }}</span>
                </td>

                <td>
                  <div class="items-summary-list">
                    <span *ngFor="let item of ord.items" class="item-tag">
                      {{ item.quantity }}x {{ item.productName }}
                    </span>
                  </div>
                </td>

                <td>
                  <span class="slot-pill">🌅 5:30 – 7:30 AM</span>
                  <span class="date-sub">{{ formatDate(ord.deliveryDate) }}</span>
                </td>

                <td>
                  <span class="addr-text">{{ ord.address?.houseFlat }}, {{ ord.address?.area }}</span>
                </td>

                <td>
                  <strong class="ord-amt">{{ ord.totalAmount | inrCurrency }}</strong>
                  <span class="pay-method-badge">{{ ord.paymentMethod }}</span>
                </td>

                <td>
                  <select
                    [ngModel]="ord.status"
                    (ngModelChange)="updateStatus(ord, $event)"
                    class="status-select-control {{ ord.status.toLowerCase() }}"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>

                <td>
                  <button class="btn btn-light btn-sm" (click)="viewOrder(ord)">
                    👁️ Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="orders().length === 0">
          <p>No orders found matching the selected filter.</p>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <div class="modal-backdrop" *ngIf="selectedOrderModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>📦 Order Details: {{ selectedOrderModal.orderNumber }}</h3>
            <button class="close-btn" (click)="selectedOrderModal = null">✕</button>
          </div>
          <div class="modal-body" *ngIf="selectedOrderModal as ord">
            <div class="modal-info-grid">
              <div>
                <label>Customer Name:</label>
                <strong>{{ ord.user?.name }} ({{ ord.user?.phone }})</strong>
              </div>
              <div>
                <label>Status:</label>
                <span class="status-pill">{{ ord.status }}</span>
              </div>
              <div>
                <label>Delivery Slot:</label>
                <strong>5:30 AM – 7:30 AM ({{ formatDate(ord.deliveryDate) }})</strong>
              </div>
              <div>
                <label>Payment Method:</label>
                <strong>{{ ord.paymentMethod }} ({{ ord.paymentStatus }})</strong>
              </div>
            </div>

            <h4 class="mt-4">Items:</h4>
            <div class="modal-items-list">
              <div *ngFor="let item of ord.items" class="modal-item-row">
                <span>🥛 {{ item.productName }} ({{ item.unit | milkUnit }})</span>
                <span>{{ item.quantity }}x</span>
                <strong>{{ item.totalPrice | inrCurrency }}</strong>
              </div>
            </div>

            <div class="modal-total-row">
              <span>Total Amount Paid:</span>
              <strong>{{ ord.totalAmount | inrCurrency }}</strong>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" (click)="selectedOrderModal = null">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-orders-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-head {
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 1.8rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .filters-card {
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .status-tabs {
      display: flex;
      gap: 6px;
      overflow-x: auto;

      .tab-btn {
        padding: 6px 12px;
        border-radius: var(--radius-full);
        border: 1px solid var(--border-subtle);
        background: #ffffff;
        font-size: 0.825rem;
        font-weight: 600;
        cursor: pointer;

        &.active {
          background-color: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
      }
    }

    .search-input-wrap {
      position: relative;
      min-width: 260px;

      .search-field {
        width: 100%;
        padding: 8px 34px 8px 12px;
        border-radius: var(--radius-full);
        border: 1.5px solid var(--border-subtle);
        font-size: 0.85rem;
      }
      .search-icon {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.6;
      }
    }

    .orders-table-card { padding: 0; overflow: hidden; }
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
        vertical-align: middle;
      }
    }

    .ord-num { font-size: 0.95rem; display: block; color: var(--text-main); }
    .ord-time { font-size: 0.72rem; color: var(--text-muted); }
    .cust-phone { font-size: 0.75rem; color: var(--text-muted); display: block; }
    .items-summary-list { display: flex; flex-direction: column; gap: 2px; }
    .item-tag { font-size: 0.8rem; }
    .slot-pill { font-size: 0.75rem; font-weight: 700; color: var(--butter-dark); display: block; }
    .date-sub { font-size: 0.72rem; color: var(--text-muted); }
    .addr-text { font-size: 0.8rem; color: var(--text-body); max-width: 180px; display: block; }
    .ord-amt { font-size: 1rem; color: var(--primary); display: block; }
    .pay-method-badge { font-size: 0.65rem; color: var(--text-muted); font-weight: 700; }

    .status-select-control {
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      font-weight: 800;
      font-size: 0.75rem;
      cursor: pointer;

      &.delivered { background-color: var(--success-bg); color: var(--success); }
      &.out_for_delivery { background-color: var(--sky-subtle); color: var(--sky-blue); }
      &.preparing { background-color: var(--warning-bg); color: var(--warning); }
      &.confirmed { background-color: var(--primary-subtle); color: var(--primary); }
      &.cancelled { background-color: var(--danger-bg); color: var(--danger); }
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

    .modal-dialog {
      background: #ffffff;
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 540px;
      padding: 24px;
    }

    .modal-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background-color: var(--bg-app);
      padding: 14px;
      border-radius: var(--radius-md);

      label { font-size: 0.75rem; color: var(--text-muted); display: block; }
    }

    .modal-items-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 12px 0;
    }

    .modal-item-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: var(--bg-app);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }

    .modal-total-row {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid var(--border-subtle);
      padding-top: 10px;
      font-size: 1.1rem;
    }

    .empty-state { padding: 40px; text-align: center; color: var(--text-muted); }
  `],
})
export class SellerOrdersComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);

  orders = signal<Order[]>([]);
  counts = signal<any>(null);
  totalCount = signal<number>(0);

  selectedStatus = '';
  searchQuery = '';

  selectedOrderModal: Order | null = null;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.api.get<{ orders: Order[]; meta: { total: number }; counts: any }>('orders/admin/all', {
      status: this.selectedStatus || undefined,
      search: this.searchQuery || undefined,
    }).subscribe({
      next: (res) => {
        this.orders.set(res?.orders || []);
        this.totalCount.set(res?.meta?.total || 0);
        this.counts.set(res?.counts || {});
      },
    });
  }

  setStatus(status: string) {
    this.selectedStatus = status;
    this.loadOrders();
  }

  onSearchChange() {
    this.loadOrders();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return format(parseISO(dateStr), 'dd MMM, hh:mm a');
  }

  updateStatus(ord: Order, newStatus: OrderStatus) {
    this.api.patch(`orders/${ord.id}/status`, { status: newStatus }).subscribe({
      next: () => {
        this.toast.success(`Order #${ord.orderNumber} status updated to ${newStatus}`);
        this.loadOrders();
      },
    });
  }

  viewOrder(ord: Order) {
    this.selectedOrderModal = ord;
  }
}
