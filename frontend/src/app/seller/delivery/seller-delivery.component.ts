import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { format, addDays } from 'date-fns';

@Component({
  selector: 'app-seller-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="seller-delivery-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Logistics</span>
          <h1>🚚 Morning Delivery Run Sheets & Route Dispatch</h1>
          <p class="page-desc">Organize delivery routes, assign delivery partners, and track live door-to-drop fulfillment progress.</p>
        </div>
      </div>

      <!-- Route Cards Overview -->
      <div class="routes-overview-grid" *ngIf="runSheets() as runs">
        <div *ngFor="let run of runs" class="route-card card">
          <div class="route-top">
            <div class="route-title-box">
              <span class="route-badge">{{ run.slot === 'MORNING_5_30_7_30' ? '🌅 Morning Run' : '🌆 Evening Run' }}</span>
              <h3>{{ run.routeName }}</h3>
              <span class="route-areas">Sectors: {{ run.pincodes?.join(', ') || 'Sector 14, 15, 17' }}</span>
            </div>
            <div class="status-box">
              <span class="run-status {{ run.status.toLowerCase() }}">{{ run.status }}</span>
            </div>
          </div>

          <div class="driver-row">
            <span class="d-icon">🛵</span>
            <div class="d-info">
              <span class="d-label">Assigned Delivery Partner:</span>
              <strong>{{ run.deliveryPerson?.user?.name || 'Suresh Kumar' }} ({{ run.deliveryPerson?.user?.phone || '+91 98765 00004' }})</strong>
            </div>
          </div>

          <div class="route-stats">
            <div class="stat">
              <span>Total Stops:</span>
              <strong>{{ run.totalStops }}</strong>
            </div>
            <div class="stat">
              <span>Delivered:</span>
              <strong class="text-success">{{ run.completedStops }}</strong>
            </div>
            <div class="stat">
              <span>Pending:</span>
              <strong class="text-warning">{{ run.totalStops - run.completedStops }}</strong>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-wrap">
            <div class="progress-bar-fill" [style.width.%]="(run.completedStops / (run.totalStops || 1)) * 100"></div>
          </div>

          <!-- Stops List -->
          <div class="stops-list" *ngIf="run.stops?.length > 0">
            <h4>Doorstep Drops Sequence ({{ run.stops.length }} Addresses):</h4>
            <div *ngFor="let stop of run.stops; let idx = index" class="stop-item" [class.delivered]="stop.status === 'DELIVERED'">
              <span class="seq-num">{{ idx + 1 }}</span>
              <div class="stop-info">
                <strong>{{ stop.customerName }}</strong>
                <span>{{ stop.address }}</span>
                <span class="inst-tag" *ngIf="stop.deliveryInstructions">📝 {{ stop.deliveryInstructions }}</span>
              </div>
              <div class="stop-items">
                <span class="badge badge-primary">{{ stop.quantity }}x Milk</span>
                <span class="stop-status-pill {{ stop.status.toLowerCase() }}">{{ stop.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-delivery-page { display: flex; flex-direction: column; gap: 24px; }
    .page-head {
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 1.8rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .routes-overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
      gap: 24px;
    }

    .route-card { padding: 24px; }

    .route-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 14px;

      .route-badge { font-size: 0.72rem; font-weight: 800; color: var(--primary); text-transform: uppercase; }
      h3 { font-size: 1.25rem; margin: 2px 0; }
      .route-areas { font-size: 0.8rem; color: var(--text-muted); }
    }

    .run-status {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      &.in_progress { background-color: var(--warning-bg); color: var(--warning); }
      &.completed { background-color: var(--success-bg); color: var(--success); }
    }

    .driver-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background-color: var(--bg-app);
      padding: 10px 14px;
      border-radius: var(--radius-md);
      margin-bottom: 16px;

      .d-icon { font-size: 1.4rem; }
      .d-info { display: flex; flex-direction: column; font-size: 0.85rem; }
      .d-label { font-size: 0.72rem; color: var(--text-muted); }
    }

    .route-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 12px;
      text-align: center;

      .stat {
        display: flex;
        flex-direction: column;
        span { font-size: 0.75rem; color: var(--text-muted); }
        strong { font-size: 1.2rem; }
      }
      .text-success { color: var(--success); }
      .text-warning { color: var(--warning); }
    }

    .progress-wrap {
      height: 8px;
      background-color: var(--border-subtle);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: 20px;

      .progress-bar-fill { height: 100%; background-color: var(--primary); }
    }

    .stops-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      h4 { font-size: 0.95rem; margin-bottom: 8px; color: var(--text-main); }
    }

    .stop-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background-color: var(--bg-app);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);

      &.delivered {
        opacity: 0.85;
        background-color: #f6fcf8;
        border-color: var(--success-bg);
      }

      .seq-num {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: var(--primary);
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stop-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        font-size: 0.85rem;
        span { font-size: 0.75rem; color: var(--text-muted); }
        .inst-tag { font-size: 0.72rem; color: var(--butter-dark); font-style: italic; }
      }

      .stop-items {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .stop-status-pill {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        text-transform: uppercase;

        &.delivered { background-color: var(--success-bg); color: var(--success); }
        &.pending, &.scheduled { background-color: var(--sky-subtle); color: var(--sky-blue); }
      }
    }
  `],
})
export class SellerDeliveryComponent implements OnInit {
  api = inject(ApiService);
  runSheets = signal<any[]>([]);

  ngOnInit() {
    this.loadRuns();
  }

  loadRuns() {
    const today = format(new Date(), 'yyyy-MM-dd');
    this.api.get<any[]>('delivery/runs', { date: today }).subscribe({
      next: (runs) => this.runSheets.set(runs || []),
    });
  }
}
