import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { PersonaSwitcherComponent } from '../shared/components/persona-switcher/persona-switcher.component';
import { ToastContainerComponent } from '../shared/components/toast-container/toast-container.component';
import * as confetti from 'canvas-confetti';

@Component({
  selector: 'app-run-sheet',
  standalone: true,
  imports: [CommonModule, RouterModule, PersonaSwitcherComponent, ToastContainerComponent],
  template: `
    <div class="run-sheet-page">
      <!-- Top Driver Header -->
      <header class="driver-header">
        <div class="driver-profile-row">
          <div class="driver-avatar">🛵</div>
          <div>
            <span class="badge-role">DELIVERY RUN SHEET</span>
            <h2>Suresh Kumar</h2>
            <span class="route-name">Route A: Sector 14 & 15 Morning Dispatch</span>
          </div>
        </div>

        <!-- Progress Metrics -->
        <div class="run-kpis">
          <div class="rk-box">
            <span>Total Drops</span>
            <strong>{{ stops().length }}</strong>
          </div>
          <div class="rk-box delivered">
            <span>Completed</span>
            <strong>{{ completedCount() }}</strong>
          </div>
          <div class="rk-box pending">
            <span>Remaining</span>
            <strong>{{ stops().length - completedCount() }}</strong>
          </div>
        </div>

        <div class="progress-bar-bg">
          <div class="progress-bar-fill" [style.width.%]="(completedCount() / (stops().length || 1)) * 100"></div>
        </div>
      </header>

      <!-- Run Sheet Stops List -->
      <main class="stops-container">
        <div *ngFor="let stop of stops(); let idx = index" class="stop-card card" [class.delivered]="stop.status === 'DELIVERED'">
          <div class="stop-top">
            <div class="stop-seq">
              <span class="num">{{ idx + 1 }}</span>
              <span class="slot-pill">🌅 5:30 – 7:30 AM</span>
            </div>

            <div class="stop-actions-top">
              <a [href]="'tel:' + stop.phone" class="call-btn">📞 Call Customer</a>
            </div>
          </div>

          <div class="stop-content">
            <h3 class="cust-name">{{ stop.customerName }}</h3>
            <p class="cust-address">📍 {{ stop.address }}</p>

            <div class="special-instructions" *ngIf="stop.deliveryInstructions">
              <span class="inst-icon">📝</span>
              <span><strong>Note:</strong> {{ stop.deliveryInstructions }}</span>
            </div>

            <div class="items-drop-box">
              <span class="items-title">Items to deliver:</span>
              <div class="items-tags">
                <span class="item-badge">🥛 {{ stop.quantity }}x {{ stop.productName || 'Pure Cow Milk (1L)' }}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="stop-footer" *ngIf="stop.status !== 'DELIVERED'">
            <button class="btn btn-outline btn-sm skip-btn" (click)="markFailed(stop)">
              ✕ Unable to Drop
            </button>
            <button class="btn btn-primary btn-lg deliver-btn" (click)="markDelivered(stop)">
              ✓ Mark Delivered
            </button>
          </div>

          <div class="delivered-banner" *ngIf="stop.status === 'DELIVERED'">
            <span>✓ Dropped Successfully at Doorstep</span>
          </div>
        </div>

        <!-- 100% Completion Celebration -->
        <div class="all-done-card card" *ngIf="stops().length > 0 && completedCount() === stops().length">
          <span class="party-icon">🎉</span>
          <h2>Morning Run Completed!</h2>
          <p>Great job, Suresh! All {{ stops().length }} morning doorstep deliveries have been completed successfully.</p>
        </div>
      </main>

      <!-- Persona Switcher -->
      <app-persona-switcher></app-persona-switcher>

      <!-- Toasts -->
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .run-sheet-page {
      min-height: 100vh;
      background-color: #f0f4f2;
      padding-bottom: 90px;
    }

    .driver-header {
      background: linear-gradient(135deg, var(--primary) 0%, #11281e 100%);
      color: #ffffff;
      padding: 24px 20px 20px;
      position: sticky;
      top: 0;
      z-index: 800;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .driver-profile-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;

      .driver-avatar {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
      }

      .badge-role {
        font-size: 0.65rem;
        font-weight: 800;
        color: var(--butter-gold);
        letter-spacing: 0.08em;
      }

      h2 { font-size: 1.3rem; margin: 2px 0; color: #ffffff; }
      .route-name { font-size: 0.8rem; color: var(--primary-subtle); }
    }

    .run-kpis {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 12px;

      .rk-box {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(4px);
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        display: flex;
        flex-direction: column;
        text-align: center;

        span { font-size: 0.7rem; color: var(--primary-subtle); }
        strong { font-size: 1.25rem; }

        &.delivered strong { color: #86efac; }
        &.pending strong { color: #fde047; }
      }
    }

    .progress-bar-bg {
      height: 6px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      overflow: hidden;

      .progress-bar-fill { height: 100%; background-color: var(--butter-gold); }
    }

    .stops-container {
      max-width: 600px;
      margin: 20px auto;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stop-card {
      padding: 18px;
      border: 1.5px solid var(--border-subtle);
      transition: all 0.2s ease;

      &.delivered {
        background-color: #f7fdf9;
        border-color: #86efac;
        opacity: 0.9;
      }
    }

    .stop-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .stop-seq {
      display: flex;
      align-items: center;
      gap: 8px;

      .num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: var(--primary);
        color: #ffffff;
        font-weight: 800;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .slot-pill {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--butter-dark);
        background-color: var(--cream-surface);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
      }
    }

    .call-btn {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary);
      background-color: var(--primary-subtle);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
    }

    .cust-name { font-size: 1.15rem; margin-bottom: 4px; }
    .cust-address { font-size: 0.9rem; color: var(--text-body); margin-bottom: 10px; }

    .special-instructions {
      background-color: #fff9eb;
      border: 1px dashed var(--butter-gold);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.825rem;
      color: var(--butter-dark);
      margin-bottom: 12px;
      display: flex;
      gap: 6px;
    }

    .items-drop-box {
      margin-bottom: 16px;
      .items-title { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px; }
      .item-badge {
        font-size: 0.85rem;
        font-weight: 800;
        color: var(--primary);
        background-color: var(--primary-subtle);
        padding: 4px 10px;
        border-radius: var(--radius-sm);
      }
    }

    .stop-footer {
      display: flex;
      gap: 10px;

      .deliver-btn {
        flex: 1;
        font-size: 0.95rem;
        padding: 12px;
      }
    }

    .delivered-banner {
      background-color: var(--success-bg);
      color: var(--success);
      font-weight: 800;
      font-size: 0.85rem;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      text-align: center;
    }

    .all-done-card {
      text-align: center;
      padding: 40px 20px;
      .party-icon { font-size: 3.5rem; margin-bottom: 12px; }
      h2 { font-size: 1.4rem; margin-bottom: 6px; color: var(--primary); }
      p { font-size: 0.9rem; color: var(--text-muted); }
    }
  `],
})
export class RunSheetComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);

  stops = signal<any[]>([
    {
      id: 'stop_01',
      customerName: 'Rahul Sharma',
      phone: '+91 98111 22334',
      address: 'Flat 402, Tower B, Sector 14, Gurugram',
      deliveryInstructions: 'Leave in blue insulated bag outside door. Do not ring bell.',
      quantity: 1,
      productName: 'A2 Gir Cow Milk (1L Glass Bottle)',
      status: 'SCHEDULED',
    },
    {
      id: 'stop_02',
      customerName: 'Priya Patel',
      phone: '+91 98222 33445',
      address: 'House 88, Sector 15-A, Gurugram',
      deliveryInstructions: 'Place on milk table near gate.',
      quantity: 2,
      productName: 'Full Cream Buffalo Milk (1L)',
      status: 'SCHEDULED',
    },
    {
      id: 'stop_03',
      customerName: 'Amit Verma',
      phone: '+91 98333 44556',
      address: 'Villa 12, Palm Meadows, Sector 14, Gurugram',
      deliveryInstructions: 'Ring bell once after dropping.',
      quantity: 1,
      productName: 'Farm Fresh Cow Milk (1L)',
      status: 'SCHEDULED',
    },
    {
      id: 'stop_04',
      customerName: 'Sunita Mehra',
      phone: '+91 98444 55667',
      address: 'Flat 101, Oakwood Residency, Sector 15, Gurugram',
      deliveryInstructions: 'Leave with security desk.',
      quantity: 1,
      productName: 'Artisanal Malai Paneer (200g)',
      status: 'SCHEDULED',
    },
  ]);

  completedCount = signal<number>(0);

  ngOnInit() {
    this.updateCompletedCount();
  }

  updateCompletedCount() {
    const count = this.stops().filter((s) => s.status === 'DELIVERED').length;
    this.completedCount.set(count);
  }

  markDelivered(stop: any) {
    stop.status = 'DELIVERED';
    this.updateCompletedCount();
    this.toast.success(`✓ Delivery completed for ${stop.customerName}`);

    if (this.completedCount() === this.stops().length) {
      try {
        const launchConfetti = (confetti as any).default || (confetti as any);
        launchConfetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }

  markFailed(stop: any) {
    stop.status = 'FAILED';
    this.toast.warning(`Marked unable to drop for ${stop.customerName}`);
  }
}
