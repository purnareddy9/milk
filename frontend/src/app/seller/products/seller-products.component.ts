import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, Category } from '../../core/models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../shared/pipes/milk-unit.pipe';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="seller-products-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Operations / Products</span>
          <h1>🏷️ Product Catalog & Subscription Pricing</h1>
          <p class="page-desc">Manage your milk variants, value-added dairy products, fat/SNF specs, and discount pricing.</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          + Add New Dairy Product
        </button>
      </div>

      <!-- Products Table -->
      <div class="table-card card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Pack Size</th>
                <th>Fat % | SNF %</th>
                <th>Instant Price</th>
                <th>Subscription Price</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of products()">
                <td class="prod-cell">
                  <img [src]="p.imageUrl" [alt]="p.name" class="mini-thumb" />
                  <div>
                    <strong>{{ p.name }}</strong>
                    <span class="organic-tag" *ngIf="p.isOrganic">🌿 100% Organic</span>
                  </div>
                </td>
                <td><span class="cat-badge">{{ p.category?.name }}</span></td>
                <td><span class="unit-tag">{{ p.unit | milkUnit }}</span></td>
                <td>
                  <span class="specs-tag" *ngIf="p.fatPercent">{{ p.fatPercent }}% Fat | {{ p.snfPercent }}% SNF</span>
                  <span *ngIf="!p.fatPercent">—</span>
                </td>
                <td><strong>{{ p.price | inrCurrency }}</strong></td>
                <td><strong class="sub-price">{{ p.subscriptionPrice | inrCurrency }}</strong></td>
                <td>
                  <span class="active-badge" [class.on]="p.isActive">{{ p.isActive ? 'Active' : 'Inactive' }}</span>
                </td>
                <td>
                  <button class="btn btn-light btn-sm" (click)="openEditModal(p)">✏️ Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Product Modal -->
      <div class="modal-backdrop" *ngIf="isModalOpen">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ editingId ? '✏️ Edit Product' : '🥛 Add New Dairy Product' }}</h3>
            <button class="close-btn" (click)="isModalOpen = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Product Name</label>
                <input type="text" [(ngModel)]="formData.name" placeholder="e.g. Pure Desi Cow Milk" class="form-control" />
              </div>
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="formData.categoryId" class="form-control">
                  <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>One-Time Price (₹)</label>
                <input type="number" [(ngModel)]="formData.price" class="form-control" />
              </div>
              <div class="form-group">
                <label>Subscription Price (₹/day)</label>
                <input type="number" [(ngModel)]="formData.subscriptionPrice" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Unit / Pack Size</label>
                <input type="text" [(ngModel)]="formData.unit" placeholder="e.g. 1L, 500ml, 200g" class="form-control" />
              </div>
              <div class="form-group">
                <label>Shelf Life (Days)</label>
                <input type="number" [(ngModel)]="formData.shelfLifeDays" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Fat %</label>
                <input type="number" [(ngModel)]="formData.fatPercent" step="0.1" class="form-control" />
              </div>
              <div class="form-group">
                <label>SNF %</label>
                <input type="number" [(ngModel)]="formData.snfPercent" step="0.1" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label>Product Image URL</label>
              <input type="text" [(ngModel)]="formData.imageUrl" class="form-control" />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="formData.description" rows="2" class="form-control"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" (click)="isModalOpen = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveProduct()">Save Product</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seller-products-page { display: flex; flex-direction: column; gap: 24px; }
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

    .table-card { padding: 0; overflow: hidden; }
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
      .mini-thumb { width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover; }
      .organic-tag { font-size: 0.7rem; color: var(--primary); font-weight: 700; display: block; }
    }

    .cat-badge { font-size: 0.8rem; color: var(--text-muted); }
    .unit-tag { font-size: 0.78rem; background-color: var(--bg-app); padding: 2px 6px; border-radius: var(--radius-sm); }
    .specs-tag { font-size: 0.78rem; font-weight: 700; color: var(--butter-dark); }
    .sub-price { color: var(--primary); font-size: 0.95rem; }

    .active-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background-color: var(--border-subtle);

      &.on { background-color: var(--success-bg); color: var(--success); }
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
  `],
})
export class SellerProductsComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  isModalOpen = false;
  editingId: string | null = null;

  formData: any = {
    name: '',
    categoryId: '',
    price: 64,
    subscriptionPrice: 58,
    unit: '1L',
    shelfLifeDays: 3,
    fatPercent: 4.5,
    snfPercent: 8.5,
    imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=800&auto=format&fit=crop&q=80',
    description: '100% farm pure pasteurized milk.',
    isOrganic: true,
  };

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts() {
    this.api.get<{ products: Product[] }>('products').subscribe({
      next: (res) => this.products.set(res?.products || []),
    });
  }

  loadCategories() {
    this.api.get<Category[]>('categories').subscribe({
      next: (cats) => this.categories.set(cats || []),
    });
  }

  openAddModal() {
    this.editingId = null;
    this.formData = {
      name: '',
      categoryId: this.categories()[0]?.id || '',
      price: 64,
      subscriptionPrice: 58,
      unit: '1L',
      shelfLifeDays: 3,
      fatPercent: 4.5,
      snfPercent: 8.5,
      imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=800&auto=format&fit=crop&q=80',
      description: '100% farm pure pasteurized milk.',
      isOrganic: true,
    };
    this.isModalOpen = true;
  }

  openEditModal(p: Product) {
    this.editingId = p.id;
    this.formData = { ...p };
    this.isModalOpen = true;
  }

  saveProduct() {
    if (this.editingId) {
      this.api.put(`products/${this.editingId}`, this.formData).subscribe({
        next: () => {
          this.toast.success('Product updated successfully');
          this.isModalOpen = false;
          this.loadProducts();
        },
      });
    } else {
      this.api.post('products', this.formData).subscribe({
        next: () => {
          this.toast.success('Product added successfully');
          this.isModalOpen = false;
          this.loadProducts();
        },
      });
    }
  }
}
