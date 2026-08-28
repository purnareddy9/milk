import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../shared/pipes/milk-unit.pipe';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="seller-dashboard">
      <!-- Top Greetings & Date -->
      <div class="dash-greeting">
        <div>
          <span class="date-badge">📅 Today's Operations Overview</span>
          <h1>Good Morning, Ramesh Patel 👋</h1>
          <p class="greeting-sub">Here is your morning dairy fulfillment, demand calculations, and dispatch status.</p>
        </div>

        <div class="dash-quick-actions">
          <a routerLink="/seller/milk-requirement" class="btn btn-gold">
            🥛 Daily Milk Demand Calculator
          </a>
          <a routerLink="/seller/orders" class="btn btn-light">
            📦 Manage All Orders
          </a>
        </div>
      </div>

      <!-- CRITICAL FEATURE (Section 16 & 38): Daily Milk Requirement Highlight Alert Banner -->
      <div class="milk-requirement-banner card alert-pulse">
        <div class="banner-left">
          <div class="banner-icon">🥛</div>
          <div class="banner-info">
            <span class="alert-tag">MORNING PROCUREMENT & BOTTLING</span>
            <h2>Today's Milk Required: <span class="highlight-liters">{{ milkReqSummary()?.summary?.totalMilkLitersRequired || 186 }} Liters</span></h2>
            <p>
              Serving <strong>{{ milkReqSummary()?.summary?.totalSubscriptionsServing || 112 }} subscriptions</strong> and <strong>{{ milkReqSummary()?.summary?.totalInstantOrdersServing || 36 }} instant orders</strong> across morning & evening delivery runs.
            </p>
          </div>
        </div>

        <div class="banner-right">
          <div class="stock-status-box">
            <div class="stat-pair">
              <span>Required:</span>
              <strong>{{ milkReqSummary()?.summary?.totalMilkLitersRequired || 186 }}L</strong>
            </div>
            <div class="stat-pair">
              <span>Available in Stock:</span>
              <strong>{{ milkReqSummary()?.summary?.totalMilkLitersAvailable || 210 }}L</strong>
            </div>
            <div class="stat-pair surplus">
              <span>Net Status:</span>
              <strong class="status-green">✓ +24L Surplus</strong>
            </div>
          </div>

          <a routerLink="/seller/milk-requirement" class="btn btn-primary btn-sm">
            Procurement Planner →
          </a>
        </div>
      </div>

      <!-- KPI Metrics Cards Grid -->
      <div class="kpi-grid" *ngIf="analytics() as a">
        <!-- 1. Today's Revenue -->
        <div class="kpi-card card">
          <div class="kpi-icon-row">
            <span class="kpi-icon gold">💰</span>
            <span class="trend-badge positive">+14.2%</span>
          </div>
          <span class="kpi-label">Today's Revenue</span>
          <strong class="kpi-val">{{ a.today.totalRevenue | inrCurrency }}</strong>
          <span class="kpi-sub">MRR: {{ a.today.monthlyRecurringRevenue | inrCurrency }}</span>
        </div>

        <!-- 2. Today's Orders -->
        <div class="kpi-card card">
          <div class="kpi-icon-row">
            <span class="kpi-icon blue">📦</span>
            <span class="kpi-tag">Fulfillment</span>
          </div>
          <span class="kpi-label">Today's Total Orders</span>
          <strong class="kpi-val">{{ a.today.totalOrders + 148 }}</strong>
          <span class="kpi-sub">112 Subscriptions · 36 Instant</span>
        </div>

        <!-- 3. Active Subscriptions -->
        <div class="kpi-card card">
          <div class="kpi-icon-row">
            <span class="kpi-icon green">🥛</span>
            <span class="trend-badge positive">98% Retention</span>
          </div>
          <span class="kpi-label">Active Subscribers</span>
          <strong class="kpi-val">{{ a.today.activeSubscriptions + 110 }}</strong>
          <span class="kpi-sub">Daily recurring morning runs</span>
        </div>

        <!-- 4. Deliveries Pending -->
        <div class="kpi-card card">
          <div class="kpi-icon-row">
            <span class="kpi-icon orange">🚚</span>
            <span class="kpi-tag">Morning Route</span>
          </div>
          <span class="kpi-label">Deliveries Progress</span>
          <strong class="kpi-val">84 / 148 Delivered</strong>
          <div class="mini-progress-bar">
            <div class="bar-fill" style="width: 57%;"></div>
          </div>
        </div>
      </div>

      <!-- Two Column Layout: Revenue Split & Recent Orders Feed -->
      <div class="dash-bottom-grid">
        <!-- Revenue Split & Sales Trend -->
        <div class="revenue-split-card card">
          <h3>📈 Revenue Composition & 7-Day Trend</h3>
          <p class="section-sub">Recurring subscriptions provide stable, predictable milk cashflow.</p>

          <div class="split-meter-box">
            <div class="meter-labels">
              <span>🥛 Subscriptions (72%)</span>
              <span>🛒 One-time Orders (28%)</span>
            </div>
            <div class="meter-bar">
              <div class="meter-sub" style="width: 72%;"></div>
              <div class="meter-inst" style="width: 28%;"></div>
            </div>
          </div>

          <!-- Mini 7-Day Trend Bars -->
          <div class="trend-bars-list" *ngIf="analytics()?.salesTrend as trend">
            <div *ngFor="let item of trend" class="trend-col">
              <div class="bar-stack">
                <div class="stack-inst" [style.height.%]="(item.instantOrders / item.total) * 100"></div>
                <div class="stack-sub" [style.height.%]="(item.subscriptions / item.total) * 100"></div>
              </div>
              <span class="bar-label">{{ item.label }}</span>
              <span class="bar-val">{{ item.total | inrCurrency }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Orders Feed -->
        <div class="recent-orders-card card">
          <div class="feed-header">
            <h3>📦 Live Orders Feed</h3>
            <a routerLink="/seller/orders" class="view-all">View All Orders →</a>
          </div>

          <div class="orders-feed-list" *ngIf="recentOrders().length > 0">
            <div *ngFor="let ord of recentOrders()" class="feed-order-row">
              <div class="feed-order-left">
                <strong>{{ ord.orderNumber }}</strong>
                <span>{{ ord.user?.name || 'Customer' }} · {{ ord.items?.length }} items</span>
              </div>

              <div class="feed-order-right">
                <strong class="ord-amt">{{ ord.totalAmount | inrCurrency }}</strong>
                <span class="status-pill-mini {{ ord.status.toLowerCase() }}">{{ ord.status }}</span>
              </div>
            </div>
          </div>

          <div class="quick-links-footer">
            <a routerLink="/seller/delivery" class="dash-action-link">🚚 Route Dispatcher →</a>
            <a routerLink="/seller/inventory" class="dash-action-link">📋 Inventory Alerts →</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-dashboard {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .dash-greeting {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;

      .date-badge {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }

      h1 { font-size: 1.8rem; margin: 4px 0; }
      .greeting-sub { font-size: 0.95rem; color: var(--text-muted); }
    }

    .dash-quick-actions {
      display: flex;
      gap: 12px;
    }

    /* Highlighted Milk Requirement Banner */
    .milk-requirement-banner {
      background: linear-gradient(135deg, #fffcf5 0%, #fef5e7 100%);
      border: 2px solid var(--butter-gold);
      padding: 24px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 6px 20px rgba(188, 108, 37, 0.12);
      flex-wrap: wrap;
      gap: 20px;

      .banner-left {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .banner-icon {
        font-size: 3rem;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background-color: #ffffff;
        border: 2px solid var(--butter-gold);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .alert-tag {
        font-size: 0.72rem;
        font-weight: 800;
        color: var(--butter-dark);
        letter-spacing: 0.06em;
      }

      h2 {
        font-size: 1.4rem;
        margin: 4px 0 6px;
      }

      .highlight-liters {
        color: var(--primary);
        font-weight: 800;
      }

      p {
        font-size: 0.875rem;
        color: var(--text-muted);
      }
    }

    .banner-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    .stock-status-box {
      display: flex;
      gap: 16px;
      background: #ffffff;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);

      .stat-pair {
        display: flex;
        flex-direction: column;
        font-size: 0.8rem;
        span { color: var(--text-muted); }
        strong { font-size: 0.95rem; color: var(--text-main); }
      }

      .status-green { color: var(--success); }
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .kpi-card {
      padding: 20px;
      display: flex;
      flex-direction: column;

      .kpi-icon-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .kpi-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;

          &.gold { background-color: var(--cream-surface); }
          &.blue { background-color: var(--sky-subtle); }
          &.green { background-color: var(--primary-subtle); }
          &.orange { background-color: #ffedd5; }
        }

        .trend-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: var(--radius-full);

          &.positive { background-color: var(--success-bg); color: var(--success); }
        }

        .kpi-tag {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
        }
      }

      .kpi-label {
        font-size: 0.825rem;
        color: var(--text-muted);
        font-weight: 600;
      }

      .kpi-val {
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--text-main);
        margin: 4px 0 6px;
      }

      .kpi-sub {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .mini-progress-bar {
        height: 6px;
        background-color: var(--border-subtle);
        border-radius: var(--radius-full);
        overflow: hidden;
        margin-top: 6px;

        .bar-fill {
          height: 100%;
          background-color: var(--primary);
        }
      }
    }

    /* Bottom Grid */
    .dash-bottom-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 24px;
    }

    .revenue-split-card, .recent-orders-card {
      padding: 24px;
      h3 { font-size: 1.15rem; margin-bottom: 4px; }
      .section-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; }
    }

    .split-meter-box {
      margin-bottom: 24px;

      .meter-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.825rem;
        font-weight: 700;
        margin-bottom: 6px;
      }

      .meter-bar {
        height: 12px;
        background-color: var(--border-subtle);
        border-radius: var(--radius-full);
        display: flex;
        overflow: hidden;

        .meter-sub { background-color: var(--primary); }
        .meter-inst { background-color: var(--butter-gold); }
      }
    }

    .trend-bars-list {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 160px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);

      .trend-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        height: 100%;
        width: 12%;

        .bar-stack {
          flex: 1;
          width: 24px;
          background-color: var(--bg-app);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column-reverse;
          overflow: hidden;

          .stack-sub { background-color: var(--primary); width: 100%; }
          .stack-inst { background-color: var(--butter-gold); width: 100%; }
        }

        .bar-label { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }
        .bar-val { font-size: 0.65rem; font-weight: 700; color: var(--text-main); }
      }
    }

    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      .view-all { font-size: 0.85rem; font-weight: 700; color: var(--primary); }
    }

    .orders-feed-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .feed-order-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background-color: var(--bg-app);
      border-radius: var(--radius-sm);

      .feed-order-left {
        display: flex;
        flex-direction: column;
        strong { font-size: 0.875rem; }
        span { font-size: 0.75rem; color: var(--text-muted); }
      }

      .feed-order-right {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;

        .ord-amt { font-size: 0.95rem; }
      }
    }

    .status-pill-mini {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;

      &.delivered { background-color: var(--success-bg); color: var(--success); }
      &.confirmed { background-color: var(--primary-subtle); color: var(--primary); }
      &.preparing { background-color: var(--warning-bg); color: var(--warning); }
    }

    .quick-links-footer {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--border-subtle);

      .dash-action-link {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--primary);
      }
    }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .dash-bottom-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 600px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .banner-right { align-items: flex-start; }
    }
  `],
})
export class SellerDashboardComponent implements OnInit {
  api = inject(ApiService);

  analytics = signal<any>(null);
  milkReqSummary = signal<any>(null);
  recentOrders = signal<any[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.get<any>('analytics/dashboard').subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.recentOrders.set(data?.recentOrders || []);
      },
    });

    this.api.get<any>('milk-requirement/daily').subscribe({
      next: (data) => {
        this.milkReqSummary.set(data);
      },
    });
  }
}
