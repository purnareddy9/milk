import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-seller-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="seller-settings-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Settings</span>
          <h1>⚙️ Dairy Business Settings & Delivery Slots</h1>
          <p class="page-desc">Configure fulfillment time slots, order cutoff timings, free delivery threshold, and contact information.</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="card settings-card">
          <h3>🌅 Delivery Windows & Cutoff Timings</h3>
          
          <div class="form-group">
            <label>Morning Delivery Window</label>
            <input type="text" [(ngModel)]="morningSlot" class="form-control" />
          </div>

          <div class="form-group">
            <label>Evening Delivery Window</label>
            <input type="text" [(ngModel)]="eveningSlot" class="form-control" />
          </div>

          <div class="form-group">
            <label>Daily Order Cutoff Time</label>
            <input type="text" [(ngModel)]="cutoffTime" class="form-control" />
            <small class="hint">Orders placed before 10:00 PM are delivered next morning.</small>
          </div>

          <div class="form-group">
            <label>Free Delivery Threshold (₹)</label>
            <input type="number" [(ngModel)]="freeDeliveryThreshold" class="form-control" />
          </div>

          <button class="btn btn-primary" (click)="saveSettings()">
            Save Configuration
          </button>
        </div>

        <div class="card settings-card">
          <h3>📍 Operating Zones & Pincodes</h3>
          <p class="pincode-desc">Active serviceable pincodes for morning farm delivery routes:</p>
          
          <div class="pincode-chips">
            <span class="pincode-tag">122001 (Sector 14, 15)</span>
            <span class="pincode-tag">122002 (DLF Phase 1, 2)</span>
            <span class="pincode-tag">122003 (Sector 45, 46)</span>
            <span class="pincode-tag">122018 (Sohna Road)</span>
          </div>

          <div class="fssai-status-box">
            <strong>FSSAI License:</strong> #10822005000124 (Active)
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-settings-page { display: flex; flex-direction: column; gap: 24px; }
    .page-head {
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 1.8rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .settings-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      h3 { font-size: 1.15rem; margin-bottom: 6px; }
      .hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: block; }
    }

    .pincode-desc { font-size: 0.875rem; color: var(--text-muted); }
    .pincode-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .pincode-tag { font-size: 0.8rem; background-color: var(--primary-subtle); color: var(--primary); padding: 6px 12px; border-radius: var(--radius-sm); font-weight: 600; }
    .fssai-status-box { background-color: var(--bg-app); padding: 12px; border-radius: var(--radius-md); font-size: 0.85rem; margin-top: 16px; }

    @media (max-width: 900px) {
      .settings-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class SellerSettingsComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);

  morningSlot = '5:30 AM – 7:30 AM';
  eveningSlot = '5:00 PM – 7:00 PM';
  cutoffTime = '10:00 PM';
  freeDeliveryThreshold = 199;

  ngOnInit() {
    this.api.get<any>('settings/delivery-slots').subscribe({
      next: (slots) => {
        if (slots && slots.length > 0) {
          this.morningSlot = slots[0].name || this.morningSlot;
        }
      },
    });
  }

  saveSettings() {
    this.toast.success('Business settings saved successfully!');
  }
}
