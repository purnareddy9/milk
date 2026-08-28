import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Address, AddressType } from '../../core/models';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container address-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Account / Saved Addresses</span>
          <h1>My Delivery Addresses</h1>
          <p class="page-desc">Manage your home, office, and doorstep milk drop instructions.</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          + Add New Address
        </button>
      </div>

      <!-- Address Grid -->
      <div class="address-grid" *ngIf="addresses().length > 0">
        <div *ngFor="let addr of addresses()" class="address-card card" [class.default-card]="addr.isDefault">
          <div class="card-head">
            <div class="head-left">
              <span class="type-tag">{{ addr.type }}</span>
              <span class="default-badge" *ngIf="addr.isDefault">⭐ Default Address</span>
            </div>
            <div class="head-actions">
              <button class="icon-btn" (click)="openEditModal(addr)" title="Edit">✏️</button>
              <button class="icon-btn delete" (click)="deleteAddress(addr.id)" title="Delete">🗑️</button>
            </div>
          </div>

          <div class="addr-body">
            <strong>{{ addr.receiverName }}</strong>
            <span class="phone">📞 {{ addr.receiverPhone }}</span>
            <p class="full-addr">{{ addr.houseFlat }}, {{ addr.apartmentStreet }}, {{ addr.area }}, {{ addr.city }} - {{ addr.pincode }}</p>
            
            <div class="instructions-box" *ngIf="addr.deliveryInstructions">
              <span class="inst-label">📝 Delivery Instructions:</span>
              <p>{{ addr.deliveryInstructions }}</p>
            </div>
          </div>

          <div class="card-foot" *ngIf="!addr.isDefault">
            <button class="btn btn-light btn-sm" (click)="setDefault(addr)">Set as Default</button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state card" *ngIf="addresses().length === 0">
        <span class="empty-icon">📍</span>
        <h2>No Saved Addresses Found</h2>
        <p>Add your home or office address to enable quick 1-click morning milk delivery.</p>
        <button class="btn btn-primary" (click)="openAddModal()">+ Add Your Delivery Address</button>
      </div>

      <!-- Add / Edit Modal -->
      <div class="modal-backdrop" *ngIf="isModalOpen">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ editingId ? '✏️ Edit Address' : '📍 Add New Address' }}</h3>
            <button class="close-btn" (click)="isModalOpen = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Receiver Name</label>
                <input type="text" [(ngModel)]="formData.receiverName" placeholder="e.g. Rahul Sharma" class="form-control" />
              </div>
              <div class="form-group">
                <label>Contact Phone</label>
                <input type="text" [(ngModel)]="formData.receiverPhone" placeholder="e.g. +91 98111 22334" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label>Address Type</label>
              <div class="type-selector">
                <button type="button" class="type-btn" [class.active]="formData.type === 'HOME'" (click)="formData.type = 'HOME'">🏠 Home</button>
                <button type="button" class="type-btn" [class.active]="formData.type === 'WORK'" (click)="formData.type = 'WORK'">💼 Office</button>
                <button type="button" class="type-btn" [class.active]="formData.type === 'OTHER'" (click)="formData.type = 'OTHER'">📍 Other</button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>House / Flat No.</label>
                <input type="text" [(ngModel)]="formData.houseFlat" placeholder="e.g. Flat 402, Tower B" class="form-control" />
              </div>
              <div class="form-group">
                <label>Apartment / Society / Street</label>
                <input type="text" [(ngModel)]="formData.apartmentStreet" placeholder="e.g. Palm Meadows Heights" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Area / Sector</label>
                <input type="text" [(ngModel)]="formData.area" placeholder="e.g. Sector 14" class="form-control" />
              </div>
              <div class="form-group">
                <label>City</label>
                <input type="text" [(ngModel)]="formData.city" placeholder="e.g. Gurugram" class="form-control" />
              </div>
              <div class="form-group">
                <label>Pincode</label>
                <input type="text" [(ngModel)]="formData.pincode" placeholder="e.g. 122001" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label>Doorstep Delivery Instructions</label>
              <textarea [(ngModel)]="formData.deliveryInstructions" rows="2" placeholder="e.g. Leave in blue insulated milk bag hooked outside door. Do not ring bell." class="form-control"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" (click)="isModalOpen = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveAddress()">Save Address</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .address-page { padding: 32px 20px 60px; }
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 2rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .address-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .address-card {
      padding: 20px;
      border: 1.5px solid var(--border-subtle);
      display: flex;
      flex-direction: column;

      &.default-card {
        border-color: var(--primary);
        background-color: #fcfffd;
      }
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .head-left {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .type-tag {
        font-size: 0.7rem;
        font-weight: 800;
        background-color: var(--primary);
        color: #ffffff;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
      }

      .default-badge {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--butter-dark);
      }
    }

    .addr-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;

      strong { font-size: 1.05rem; }
      .phone { font-size: 0.85rem; color: var(--text-muted); }
      .full-addr { font-size: 0.9rem; color: var(--text-body); margin: 6px 0; }

      .instructions-box {
        background-color: var(--bg-app);
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        margin-top: 6px;
        font-size: 0.8rem;

        .inst-label { font-weight: 700; color: var(--text-muted); }
        p { color: var(--text-body); font-style: italic; margin-top: 2px; }
      }
    }

    .card-foot {
      margin-top: 16px;
      border-top: 1px solid var(--border-subtle);
      padding-top: 12px;
    }

    .icon-btn {
      padding: 4px 6px;
      font-size: 0.9rem;
      opacity: 0.7;
      &:hover { opacity: 1; }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .type-selector {
      display: flex;
      gap: 8px;

      .type-btn {
        flex: 1;
        padding: 8px;
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        background: #ffffff;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;

        &.active {
          background-color: var(--primary-subtle);
          border-color: var(--primary);
          color: var(--primary);
        }
      }
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
      margin-bottom: 18px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `],
})
export class AddressesComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);

  addresses = signal<Address[]>([]);
  isModalOpen = false;
  editingId: string | null = null;

  formData: Partial<Address> = {
    type: 'HOME',
    receiverName: '',
    receiverPhone: '',
    houseFlat: '',
    apartmentStreet: '',
    area: '',
    city: 'Gurugram',
    pincode: '122001',
    deliveryInstructions: '',
  };

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    this.api.get<Address[]>('users/addresses').subscribe({
      next: (addrs) => this.addresses.set(addrs || []),
    });
  }

  openAddModal() {
    this.editingId = null;
    this.formData = {
      type: 'HOME',
      receiverName: '',
      receiverPhone: '',
      houseFlat: '',
      apartmentStreet: '',
      area: '',
      city: 'Gurugram',
      pincode: '122001',
      deliveryInstructions: '',
    };
    this.isModalOpen = true;
  }

  openEditModal(addr: Address) {
    this.editingId = addr.id;
    this.formData = { ...addr };
    this.isModalOpen = true;
  }

  saveAddress() {
    if (this.editingId) {
      this.api.put(`users/addresses/${this.editingId}`, this.formData).subscribe({
        next: () => {
          this.toast.success('Address updated successfully');
          this.isModalOpen = false;
          this.loadAddresses();
        },
      });
    } else {
      this.api.post('users/addresses', this.formData).subscribe({
        next: () => {
          this.toast.success('Address added successfully');
          this.isModalOpen = false;
          this.loadAddresses();
        },
      });
    }
  }

  setDefault(addr: Address) {
    this.api.put(`users/addresses/${addr.id}`, { isDefault: true }).subscribe({
      next: () => {
        this.toast.success('Default delivery address updated');
        this.loadAddresses();
      },
    });
  }

  deleteAddress(id: string) {
    if (confirm('Delete this delivery address?')) {
      this.api.delete(`users/addresses/${id}`).subscribe({
        next: () => {
          this.toast.info('Address deleted');
          this.loadAddresses();
        },
      });
    }
  }
}
