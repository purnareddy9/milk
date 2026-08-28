import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Coupon } from '../../core/models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-seller-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe],
  template: `
    <div class="seller-coupons-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Marketing</span>
          <h1>🎟️ Promo Coupons & Discount Campaigns</h1>
          <p class="page-desc">Create and manage coupon codes for new customer acquisition and subscription retention.</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          + Create New Coupon
        </button>
      </div>

      <div class="coupons-grid">
        <div *ngFor="let c of coupons()" class="coupon-card card">
          <div class="c-top">
            <span class="c-code">{{ c.code }}</span>
            <span class="c-status" [class.active]="c.isActive">{{ c.isActive ? 'Active' : 'Expired' }}</span>
          </div>

          <div class="c-body">
            <strong class="c-discount">
              {{ c.discountType === 'PERCENTAGE' ? c.discountValue + '% OFF' : (c.discountValue | inrCurrency) + ' OFF' }}
            </strong>
            <p class="c-desc">{{ c.description }}</p>
            <div class="c-rules">
              <span>Min Order: {{ c.minOrderAmount | inrCurrency }}</span>
              <span *ngIf="c.maxDiscount">Max Discount: {{ c.maxDiscount | inrCurrency }}</span>
              <span>Used: {{ c.usedCount }} times</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Coupon Modal -->
      <div class="modal-backdrop" *ngIf="isModalOpen">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>🎟️ Create Promo Coupon</h3>
            <button class="close-btn" (click)="isModalOpen = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Coupon Code</label>
                <input type="text" [(ngModel)]="formData.code" placeholder="e.g. MONSOON30" class="form-control uppercase" />
              </div>
              <div class="form-group">
                <label>Discount Type</label>
                <select [(ngModel)]="formData.discountType" class="form-control">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Discount Value</label>
                <input type="number" [(ngModel)]="formData.discountValue" class="form-control" />
              </div>
              <div class="form-group">
                <label>Minimum Order Amount (₹)</label>
                <input type="number" [(ngModel)]="formData.minOrderAmount" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label>Description / Campaign Title</label>
              <input type="text" [(ngModel)]="formData.description" placeholder="e.g. 20% off on all organic milk orders" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" (click)="isModalOpen = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveCoupon()">Create Coupon</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-coupons-page { display: flex; flex-direction: column; gap: 24px; }
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 1.8rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .coupons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .coupon-card {
      padding: 20px;
      border: 1.5px dashed var(--butter-gold);
      background: linear-gradient(135deg, #ffffff 0%, #fffcf8 100%);
    }

    .c-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .c-code {
        font-family: var(--font-heading);
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--primary);
        letter-spacing: 0.05em;
        background-color: var(--primary-subtle);
        padding: 4px 10px;
        border-radius: var(--radius-sm);
      }

      .c-status {
        font-size: 0.72rem;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: var(--radius-full);
        background-color: var(--border-subtle);

        &.active { background-color: var(--success-bg); color: var(--success); }
      }
    }

    .c-discount { font-size: 1.4rem; color: var(--butter-dark); display: block; margin-bottom: 4px; }
    .c-desc { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px; }
    .c-rules { display: flex; flex-direction: column; gap: 2px; font-size: 0.75rem; color: var(--text-body); }

    .uppercase { text-transform: uppercase; }

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
      max-width: 500px;
      padding: 24px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  `],
})
export class SellerCouponsComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);

  coupons = signal<Coupon[]>([]);
  isModalOpen = false;

  formData: any = {
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 199,
    description: '',
  };

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.api.get<Coupon[]>('coupons').subscribe({
      next: (list) => this.coupons.set(list || []),
    });
  }

  openAddModal() {
    this.formData = {
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmount: 199,
      description: '',
    };
    this.isModalOpen = true;
  }

  saveCoupon() {
    this.api.post('coupons', this.formData).subscribe({
      next: () => {
        this.toast.success('Coupon created successfully');
        this.isModalOpen = false;
        this.loadCoupons();
      },
    });
  }
}
