import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { MilkRequirementDashboard, ProductRequirement } from '../../core/models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../shared/pipes/milk-unit.pipe';
import { format, addDays } from 'date-fns';

@Component({
  selector: 'app-milk-requirement',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="milk-requirement-page">
      <!-- Page Header -->
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Milk Procurement</span>
          <h1>🥛 Daily Milk Requirement & Procurement Planner</h1>
          <p class="page-desc">
            Calculates exact daily milk demand across recurring subscriptions and one-time orders to plan morning procurement, chilling, and bottling.
          </p>
        </div>

        <div class="head-actions">
          <button class="btn btn-gold" (click)="openProcurementModal()">
            + Log Farm Procurement Batch
          </button>
          <button class="btn btn-light" (click)="printRunSheet()">
            🖨️ Print Bottling Sheet
          </button>
        </div>
      </div>

      <!-- Date & Slot Filter Row -->
      <div class="filter-card card">
        <div class="filter-group">
          <label>Target Date:</label>
          <div class="date-buttons">
            <button
              class="date-chip"
              [class.active]="selectedDateTag === 'today'"
              (click)="setDate('today')"
            >
              Today ({{ todayStr }})
            </button>
            <button
              class="date-chip"
              [class.active]="selectedDateTag === 'tomorrow'"
              (click)="setDate('tomorrow')"
            >
              Tomorrow ({{ tomorrowStr }})
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>Delivery Window:</label>
          <select [(ngModel)]="selectedSlot" (change)="loadRequirement()" class="form-select">
            <option value="">All Delivery Slots</option>
            <option value="MORNING_5_30_7_30">🌅 Morning (5:30 AM – 7:30 AM)</option>
            <option value="EVENING_5_00_7_00">🌆 Evening (5:00 PM – 7:00 PM)</option>
          </select>
        </div>
      </div>

      <!-- Demand vs Stock Summary KPI Row -->
      <div class="summary-kpis" *ngIf="data() as d">
        <!-- Total Milk Required -->
        <div class="kpi-box card highlight-req">
          <div class="kpi-head">
            <span class="kpi-icon">🥛</span>
            <span class="badge badge-gold">DAILY DEMAND</span>
          </div>
          <span class="kpi-label">Total Milk Volume Required</span>
          <strong class="kpi-value">{{ d.summary.totalMilkLitersRequired }} Liters</strong>
          <span class="kpi-hint">
            Serving {{ d.summary.totalSubscriptionsServing }} Subscriptions + {{ d.summary.totalInstantOrdersServing }} Orders
          </span>
        </div>

        <!-- Available Inventory -->
        <div class="kpi-box card">
          <div class="kpi-head">
            <span class="kpi-icon">🏭</span>
            <span class="badge badge-info">WAREHOUSE STOCK</span>
          </div>
          <span class="kpi-label">Available Inventory in Chiller</span>
          <strong class="kpi-value">{{ d.summary.totalMilkLitersAvailable }} Liters</strong>
          <span class="kpi-hint">Chilled pasteurized stock on hand</span>
        </div>

        <!-- Net Surplus / Shortage -->
        <div
          class="kpi-box card"
          [class.status-surplus]="d.summary.netSurplusOrDeficitLiters >= 0"
          [class.status-shortage]="d.summary.netSurplusOrDeficitLiters < 0"
        >
          <div class="kpi-head">
            <span class="kpi-icon">{{ d.summary.netSurplusOrDeficitLiters >= 0 ? '✓' : '⚠️' }}</span>
            <span class="badge" [class.badge-success]="d.summary.netSurplusOrDeficitLiters >= 0" [class.badge-danger]="d.summary.netSurplusOrDeficitLiters < 0">
              {{ d.summary.netSurplusOrDeficitLiters >= 0 ? 'SURPLUS STOCK' : 'SHORTAGE ALERT' }}
            </span>
          </div>
          <span class="kpi-label">Net Fulfillment Status</span>
          <strong class="kpi-value">
            {{ d.summary.netSurplusOrDeficitLiters >= 0 ? '+' : '' }}{{ d.summary.netSurplusOrDeficitLiters }} Liters
          </strong>
          <span class="kpi-hint">
            {{ d.summary.netSurplusOrDeficitLiters >= 0 ? 'Inventory is fully sufficient for morning runs' : 'Procure additional milk from farm immediately' }}
          </span>
        </div>

        <!-- Delivery Stops -->
        <div class="kpi-box card">
          <div class="kpi-head">
            <span class="kpi-icon">🚚</span>
            <span class="badge badge-primary">ROUTE STOPS</span>
          </div>
          <span class="kpi-label">Total Doorstep Deliveries</span>
          <strong class="kpi-value">{{ d.summary.totalDeliveryStops }} Stops</strong>
          <span class="kpi-hint">Distributed across 4 delivery routes</span>
        </div>
      </div>

      <!-- Breakdown Table by Product & Packaging Variant -->
      <div class="breakdown-card card" *ngIf="data() as d">
        <div class="table-head-row">
          <h3>📦 Bottling & Packaging Breakdown Sheet</h3>
          <span class="table-hint">Auto-calculated from all active subscriptions + confirmed one-time orders</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product & Variant</th>
                <th>Pack Size</th>
                <th>Subscribed Units</th>
                <th>Instant Orders</th>
                <th>Total Units Required</th>
                <th>Total Volume (L/Kg)</th>
                <th>Current Stock</th>
                <th>Surplus / Shortage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of d.productBreakdown">
                <td class="product-cell">
                  <img [src]="item.imageUrl" [alt]="item.productName" class="table-thumb" />
                  <div class="prod-names">
                    <strong>{{ item.productName }}</strong>
                    <span class="cat-tag">{{ item.categorySlug }}</span>
                  </div>
                </td>
                <td><span class="unit-badge">{{ item.unit | milkUnit }}</span></td>
                <td><strong class="sub-units">{{ item.subscriptionUnits }} pkts</strong></td>
                <td><span>{{ item.instantOrderUnits }} pkts</span></td>
                <td><strong class="total-units">{{ item.totalUnitsRequired }} pkts</strong></td>
                <td><strong class="vol-liters">{{ item.totalVolumeLitersOrKg }} L</strong></td>
                <td><span class="stock-num">{{ item.currentStock }}</span></td>
                <td>
                  <span
                    class="status-pill"
                    [class.sufficient]="item.status === 'SUFFICIENT'"
                    [class.low]="item.status === 'LOW'"
                    [class.shortage]="item.status === 'SHORTAGE'"
                  >
                    {{ item.surplusOrDeficit >= 0 ? '+' : '' }}{{ item.surplusOrDeficit }}
                    ({{ item.status }})
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" (click)="quickProcure(item)">
                    + Log Batch
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Log Procurement Batch Modal -->
      <div class="modal-backdrop" *ngIf="isProcurementModalOpen">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>🥛 Log Incoming Farm Milk Batch</h3>
            <button class="close-btn" (click)="isProcurementModalOpen = false">✕</button>
          </div>

          <div class="modal-body">
            <p class="modal-desc">
              Record fresh raw milk or dairy batches received from partner dairy farms with FAT and SNF testing metrics.
            </p>

            <div class="form-group">
              <label>Select Product / Milk Variant</label>
              <select [(ngModel)]="procureProductId" class="form-control">
                <option *ngFor="let p of data()?.productBreakdown" [value]="p.productId">
                  {{ p.productName }} ({{ p.unit }})
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Procured Quantity (Units/Bottles)</label>
                <input type="number" [(ngModel)]="procureUnits" min="1" class="form-control" />
              </div>
              <div class="form-group">
                <label>Supplier Farm</label>
                <input type="text" [(ngModel)]="supplierFarm" placeholder="e.g. Village Farm #2 (GauDhara)" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tested Fat % (Lab)</label>
                <input type="number" [(ngModel)]="testedFat" step="0.1" placeholder="e.g. 4.2" class="form-control" />
              </div>
              <div class="form-group">
                <label>Tested SNF % (Lab)</label>
                <input type="number" [(ngModel)]="testedSNF" step="0.1" placeholder="e.g. 8.7" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label>Batch Number / Notes</label>
              <input type="text" [(ngModel)]="batchNotes" placeholder="e.g. Morning 4:30 AM batch, chilled to 3.8°C" class="form-control" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-light" (click)="isProcurementModalOpen = false">Cancel</button>
            <button class="btn btn-gold" (click)="submitProcurement()">Record Batch & Update Stock</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .milk-requirement-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;

      .breadcrumb {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 600;
        margin-bottom: 6px;
        display: block;
      }

      h1 { font-size: 1.8rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); max-width: 680px; font-size: 0.95rem; }
    }

    .head-actions {
      display: flex;
      gap: 10px;
    }

    .filter-card {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 32px;
      flex-wrap: wrap;

      .filter-group {
        display: flex;
        align-items: center;
        gap: 12px;

        label {
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--text-main);
        }
      }

      .date-buttons {
        display: flex;
        gap: 8px;
      }

      .date-chip {
        padding: 6px 14px;
        border-radius: var(--radius-full);
        border: 1.5px solid var(--border-subtle);
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

      .form-select {
        padding: 6px 12px;
        border-radius: var(--radius-md);
        border: 1.5px solid var(--border-subtle);
        font-size: 0.85rem;
      }
    }

    /* Summary KPIs */
    .summary-kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .kpi-box {
      padding: 22px;
      display: flex;
      flex-direction: column;

      &.highlight-req {
        border-color: var(--butter-gold);
        background: linear-gradient(135deg, #fffcf5 0%, #fff9ec 100%);
      }

      &.status-surplus {
        border-color: var(--success);
      }

      &.status-shortage {
        border-color: var(--danger);
        background-color: var(--danger-bg);
      }

      .kpi-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .kpi-icon { font-size: 1.4rem; }
      }

      .kpi-label {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 600;
      }

      .kpi-value {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--text-main);
        margin: 4px 0 6px;
      }

      .kpi-hint {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    /* Breakdown Table */
    .breakdown-card {
      padding: 24px;

      .table-head-row {
        margin-bottom: 18px;
        h3 { font-size: 1.2rem; }
        .table-hint { font-size: 0.825rem; color: var(--text-muted); }
      }
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        padding: 12px 14px;
        background-color: var(--bg-app);
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        border-bottom: 1.5px solid var(--border-subtle);
      }

      td {
        padding: 14px;
        border-bottom: 1px solid var(--border-subtle);
        font-size: 0.875rem;
        vertical-align: middle;
      }

      tbody tr:hover {
        background-color: #fbfdfc;
      }
    }

    .product-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .table-thumb {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-sm);
        object-fit: cover;
      }

      .prod-names {
        display: flex;
        flex-direction: column;
        strong { font-size: 0.9rem; }
        .cat-tag { font-size: 0.72rem; color: var(--primary-accent); font-weight: 600; }
      }
    }

    .unit-badge {
      font-size: 0.75rem;
      background-color: var(--bg-app);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      font-weight: 600;
    }

    .sub-units { color: var(--primary); font-weight: 700; }
    .total-units { font-weight: 800; color: var(--text-main); font-size: 0.95rem; }
    .vol-liters { color: var(--butter-dark); font-size: 0.95rem; font-weight: 800; }

    .status-pill {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      display: inline-block;

      &.sufficient { background-color: var(--success-bg); color: var(--success); }
      &.low { background-color: var(--warning-bg); color: var(--warning); }
      &.shortage { background-color: var(--danger-bg); color: var(--danger); }
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
      max-width: 520px;
      padding: 24px;
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    @media (max-width: 1024px) {
      .summary-kpis { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 600px) {
      .summary-kpis { grid-template-columns: 1fr; }
    }
  `],
})
export class MilkRequirementComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);

  data = signal<MilkRequirementDashboard | null>(null);

  selectedDateTag: 'today' | 'tomorrow' = 'today';
  selectedDateStr = '';
  selectedSlot = '';

  todayStr = format(new Date(), 'dd MMM');
  tomorrowStr = format(addDays(new Date(), 1), 'dd MMM');

  // Procurement modal state
  isProcurementModalOpen = false;
  procureProductId = '';
  procureUnits = 100;
  supplierFarm = 'Amrit Organic Heritage Farm #2';
  testedFat = 4.2;
  testedSNF = 8.7;
  batchNotes = 'Morning 4:30 AM milking batch chilled to 3.8°C';

  ngOnInit() {
    this.selectedDateStr = format(new Date(), 'yyyy-MM-dd');
    this.loadRequirement();
  }

  setDate(tag: 'today' | 'tomorrow') {
    this.selectedDateTag = tag;
    const target = tag === 'today' ? new Date() : addDays(new Date(), 1);
    this.selectedDateStr = format(target, 'yyyy-MM-dd');
    this.loadRequirement();
  }

  loadRequirement() {
    this.api.get<MilkRequirementDashboard>('milk-requirement/daily', {
      date: this.selectedDateStr,
      slot: this.selectedSlot || undefined,
    }).subscribe({
      next: (res) => {
        this.data.set(res);
        if (res?.productBreakdown?.length > 0 && !this.procureProductId) {
          this.procureProductId = res.productBreakdown[0].productId;
        }
      },
    });
  }

  openProcurementModal() {
    this.isProcurementModalOpen = true;
  }

  quickProcure(item: ProductRequirement) {
    this.procureProductId = item.productId;
    this.procureUnits = item.surplusOrDeficit < 0 ? Math.abs(item.surplusOrDeficit) + 30 : 50;
    this.isProcurementModalOpen = true;
  }

  submitProcurement() {
    this.api.post('milk-requirement/procure-batch', {
      productId: this.procureProductId,
      procuredUnits: this.procureUnits,
      supplierFarm: this.supplierFarm,
      fatPercent: this.testedFat,
      snfPercent: this.testedSNF,
      notes: this.batchNotes,
    }).subscribe({
      next: (res: any) => {
        this.toast.success(`🎉 ${res.message}`);
        this.isProcurementModalOpen = false;
        this.loadRequirement();
      },
    });
  }

  printRunSheet() {
    window.print();
  }
}
