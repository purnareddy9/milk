import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-seller-analytics',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe],
  template: `
    <div class="seller-analytics-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Analytics</span>
          <h1>📈 Business Intelligence & MRR Growth</h1>
          <p class="page-desc">Comprehensive reporting on revenue streams, subscription retention, and category sales performance.</p>
        </div>
      </div>

      <div class="analytics-kpi-grid" *ngIf="stats() as s">
        <div class="kpi-card card">
          <span class="k-label">Monthly Recurring Revenue (MRR)</span>
          <strong class="k-val">{{ s.today?.monthlyRecurringRevenue || 194880 | inrCurrency }}</strong>
          <span class="k-sub">112 active daily subscriptions</span>
        </div>

        <div class="kpi-card card">
          <span class="k-label">Average Order Value (AOV)</span>
          <strong class="k-val">{{ s.aov || 184 | inrCurrency }}</strong>
          <span class="k-sub">+8.4% vs last month</span>
        </div>

        <div class="kpi-card card">
          <span class="k-label">Subscription Retention</span>
          <strong class="k-val text-success">98.2%</strong>
          <span class="k-sub">Industry benchmark: 92%</span>
        </div>

        <div class="kpi-card card">
          <span class="k-label">Customer Lifetime Value (Avg LTV)</span>
          <strong class="k-val">{{ 4250 | inrCurrency }}</strong>
          <span class="k-sub">Based on 6-month cohorts</span>
        </div>
      </div>

      <!-- Category Sales Share -->
      <div class="cat-sales-grid">
        <div class="card cat-card">
          <h3>🥛 Revenue Contribution by Category</h3>
          <div class="cat-progress-list">
            <div class="cat-bar-item">
              <div class="cat-label-row">
                <span>Fresh Cow Milk (A2 & Farm)</span>
                <strong>48% ({{ 93500 | inrCurrency }})</strong>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: 48%;"></div></div>
            </div>

            <div class="cat-bar-item">
              <div class="cat-label-row">
                <span>Full Cream Buffalo Milk</span>
                <strong>26% ({{ 50600 | inrCurrency }})</strong>
              </div>
              <div class="bar-bg"><div class="bar-fill gold" style="width: 26%;"></div></div>
            </div>

            <div class="cat-bar-item">
              <div class="cat-label-row">
                <span>Artisanal Malai Paneer</span>
                <strong>14% ({{ 27200 | inrCurrency }})</strong>
              </div>
              <div class="bar-bg"><div class="bar-fill blue" style="width: 14%;"></div></div>
            </div>

            <div class="cat-bar-item">
              <div class="cat-label-row">
                <span>Vedic Bilona Ghee & Curd</span>
                <strong>12% ({{ 23580 | inrCurrency }})</strong>
              </div>
              <div class="bar-bg"><div class="bar-fill green" style="width: 12%;"></div></div>
            </div>
          </div>
        </div>

        <div class="card retention-card">
          <h3>🔄 Churn & Pause Analysis</h3>
          <p class="ret-desc">Customers rarely cancel milk subscriptions; most variations are temporary vacation pauses.</p>
          <div class="retention-stats-box">
            <div class="ret-stat">
              <span>Vacation Pauses</span>
              <strong>4.2%</strong>
            </div>
            <div class="ret-stat">
              <span>Avg Pause Duration</span>
              <strong>4.8 Days</strong>
            </div>
            <div class="ret-stat">
              <span>Auto-Resume Rate</span>
              <strong class="text-success">96%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-analytics-page { display: flex; flex-direction: column; gap: 24px; }
    .page-head {
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 1.8rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .analytics-kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .kpi-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      .k-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
      .k-val { font-size: 1.6rem; font-weight: 800; color: var(--text-main); margin: 6px 0 4px; }
      .k-sub { font-size: 0.75rem; color: var(--text-muted); }
      .text-success { color: var(--success); }
    }

    .cat-sales-grid {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 24px;
    }

    .cat-card, .retention-card {
      padding: 24px;
      h3 { font-size: 1.15rem; margin-bottom: 18px; }
    }

    .cat-progress-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cat-bar-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .cat-label-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        span { font-weight: 600; color: var(--text-main); }
        strong { color: var(--primary); }
      }

      .bar-bg {
        height: 8px;
        background-color: var(--border-subtle);
        border-radius: var(--radius-full);
        overflow: hidden;

        .bar-fill {
          height: 100%;
          background-color: var(--primary);
          &.gold { background-color: var(--butter-gold); }
          &.blue { background-color: var(--sky-blue); }
          &.green { background-color: var(--success); }
        }
      }
    }

    .ret-desc { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 20px; line-height: 1.5; }

    .retention-stats-box {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .ret-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background-color: var(--bg-app);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        span { color: var(--text-muted); }
        strong { font-size: 1.1rem; }
      }
    }

    @media (max-width: 1024px) {
      .analytics-kpi-grid { grid-template-columns: 1fr 1fr; }
      .cat-sales-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class SellerAnalyticsComponent implements OnInit {
  api = inject(ApiService);
  stats = signal<any>(null);

  ngOnInit() {
    this.api.get<any>('analytics/dashboard').subscribe({
      next: (res) => this.stats.set(res),
    });
  }
}
