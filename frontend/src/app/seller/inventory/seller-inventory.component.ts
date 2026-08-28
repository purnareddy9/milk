import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { MilkUnitPipe } from '../../shared/pipes/milk-unit.pipe';

@Component({
  selector: 'app-seller-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, MilkUnitPipe],
  template: `
    <div class="seller-inventory-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Inventory</span>
          <h1>📋 Dairy Inventory & Chiller Stock Monitor</h1>
          <p class="page-desc">Monitor daily inventory thresholds, log adjustments, and track batch wastage or spoils.</p>
        </div>
      </div>

      <div class="inventory-table-card card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Pack Size</th>
                <th>Available Quantity</th>
                <th>Reserved for Subscriptions</th>
                <th>Low Stock Alert Level</th>
                <th>Status</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of inventoryList()">
                <td class="prod-cell">
                  <img [src]="item.product?.imageUrl" [alt]="item.product?.name" class="mini-thumb" />
                  <strong>{{ item.product?.name }}</strong>
                </td>
                <td><span class="unit-tag">{{ item.product?.unit | milkUnit }}</span></td>
                <td><strong class="stock-qty">{{ item.quantity }}</strong></td>
                <td><span class="reserved-qty">{{ item.reservedQty }}</span></td>
                <td><span>{{ item.lowStockThreshold }}</span></td>
                <td>
                  <span class="status-pill" [class.in-stock]="item.quantity > item.lowStockThreshold" [class.low-stock]="item.quantity <= item.lowStockThreshold">
                    {{ item.quantity <= item.lowStockThreshold ? '⚠️ Low Stock' : '✓ In Stock' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" (click)="openAdjustModal(item)">
                    ✏️ Adjust Stock
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Adjust Stock Modal -->
      <div class="modal-backdrop" *ngIf="selectedItemForAdjust">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>✏️ Adjust Inventory Stock: {{ selectedItemForAdjust.product?.name }}</h3>
            <button class="close-btn" (click)="selectedItemForAdjust = null">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Current Stock: <strong>{{ selectedItemForAdjust.quantity }}</strong></label>
            </div>

            <div class="form-group">
              <label>Adjustment Type</label>
              <select [(ngModel)]="adjustType" class="form-control">
                <option value="RESTOCK">Restock (Received Batch)</option>
                <option value="CORRECTION">Correction (Inventory Audit)</option>
                <option value="WASTAGE">Wastage / Spoilage / Leakage</option>
              </select>
            </div>

            <div class="form-group">
              <label>Quantity Delta (+ or −)</label>
              <input type="number" [(ngModel)]="adjustQuantity" class="form-control" />
            </div>

            <div class="form-group">
              <label>Reason / Audit Note</label>
              <input type="text" [(ngModel)]="adjustReason" placeholder="e.g. Received morning bottling run" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" (click)="selectedItemForAdjust = null">Cancel</button>
            <button class="btn btn-primary" (click)="submitAdjustment()">Save Adjustment</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-inventory-page { display: flex; flex-direction: column; gap: 24px; }
    .page-head {
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 1.8rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .inventory-table-card { padding: 0; overflow: hidden; }
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

    .prod-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      .mini-thumb { width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: cover; }
    }

    .unit-tag { font-size: 0.78rem; background-color: var(--bg-app); padding: 2px 6px; border-radius: var(--radius-sm); }
    .stock-qty { font-size: 1.1rem; color: var(--primary); font-weight: 800; }
    .reserved-qty { color: var(--text-muted); font-weight: 600; }

    .status-pill {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: var(--radius-full);

      &.in-stock { background-color: var(--success-bg); color: var(--success); }
      &.low-stock { background-color: var(--warning-bg); color: var(--warning); }
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
      max-width: 480px;
      padding: 24px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `],
})
export class SellerInventoryComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);

  inventoryList = signal<any[]>([]);
  selectedItemForAdjust: any = null;

  adjustType = 'RESTOCK';
  adjustQuantity = 50;
  adjustReason = 'Daily morning batch received';

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.api.get<any[]>('inventory').subscribe({
      next: (list) => this.inventoryList.set(list || []),
    });
  }

  openAdjustModal(item: any) {
    this.selectedItemForAdjust = item;
    this.adjustQuantity = 50;
    this.adjustType = 'RESTOCK';
  }

  submitAdjustment() {
    if (!this.selectedItemForAdjust) return;

    this.api.post('inventory/adjust', {
      productId: this.selectedItemForAdjust.productId,
      quantityDelta: this.adjustType === 'WASTAGE' ? -Math.abs(this.adjustQuantity) : this.adjustQuantity,
      type: this.adjustType,
      reason: this.adjustReason,
    }).subscribe({
      next: () => {
        this.toast.success('Inventory adjusted successfully');
        this.selectedItemForAdjust = null;
        this.loadInventory();
      },
    });
  }
}
