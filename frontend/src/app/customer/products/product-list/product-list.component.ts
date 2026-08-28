import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Product, Category } from '../../../core/models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SubscriptionWizardModalComponent } from '../../../shared/components/subscription-wizard/subscription-wizard.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCardComponent,
    SubscriptionWizardModalComponent,
  ],
  template: `
    <div class="container product-page">
      <!-- Breadcrumb / Header -->
      <div class="page-header">
        <div>
          <span class="breadcrumb">Home / Fresh Dairy</span>
          <h1>Daily Farm Milk & Dairy Products</h1>
          <p class="header-desc">
            Bottled fresh every sunrise at 4:30 AM. Chilled to 4°C and delivered directly to your doorstep.
          </p>
        </div>
      </div>

      <!-- Filter Bar & Search -->
      <div class="filter-controls-bar">
        <!-- Category Filter Chips -->
        <div class="category-chips-scroll">
          <button
            class="chip-btn"
            [class.active]="selectedCategory() === ''"
            (click)="selectCategory('')"
          >
            All Products
          </button>

          <button
            *ngFor="let cat of categories()"
            class="chip-btn"
            [class.active]="selectedCategory() === cat.slug"
            (click)="selectCategory(cat.slug)"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Search Input -->
        <div class="list-search-wrap">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Search milk, curd, paneer..."
            class="search-field"
          />
          <span class="search-icon">🔍</span>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="products-grid-container">
        <div class="products-grid" *ngIf="filteredProducts().length > 0">
          <app-product-card
            *ngFor="let prod of filteredProducts()"
            [product]="prod"
            (subscribeClick)="openSubscriptionWizard($event)"
          ></app-product-card>
        </div>

        <!-- Empty State -->
        <div class="empty-state card" *ngIf="filteredProducts().length === 0">
          <span class="empty-icon">🥛</span>
          <h3>No dairy products found</h3>
          <p>Try searching for cow milk, buffalo milk, paneer, or clear filters.</p>
          <button class="btn btn-primary btn-sm" (click)="clearFilters()">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Subscription Wizard Modal -->
      <app-subscription-wizard
        *ngIf="selectedProductForSubscription"
        [product]="selectedProductForSubscription"
        [isOpen]="isWizardOpen"
        (closeWizard)="closeSubscriptionWizard()"
      ></app-subscription-wizard>
    </div>
  `,
  styles: [`
    .product-page {
      padding: 32px 20px 60px;
    }

    .page-header {
      margin-bottom: 24px;

      .breadcrumb {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 600;
        margin-bottom: 6px;
        display: block;
      }

      h1 {
        font-size: 2rem;
        margin-bottom: 6px;
      }

      .header-desc {
        color: var(--text-muted);
        font-size: 0.95rem;
        max-width: 600px;
      }
    }

    .filter-controls-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .category-chips-scroll {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .chip-btn {
      padding: 8px 16px;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--border-subtle);
      background-color: #ffffff;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-body);
      white-space: nowrap;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--primary-accent);
      }

      &.active {
        background-color: var(--primary);
        color: #ffffff;
        border-color: var(--primary);
        box-shadow: 0 4px 12px rgba(27, 67, 50, 0.2);
      }
    }

    .list-search-wrap {
      position: relative;
      min-width: 260px;

      .search-field {
        width: 100%;
        padding: 9px 36px 9px 14px;
        border-radius: var(--radius-full);
        border: 1.5px solid var(--border-subtle);
        background-color: #ffffff;
        font-size: 0.875rem;

        &:focus {
          outline: none;
          border-color: var(--primary);
        }
      }

      .search-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.6;
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .empty-icon {
        font-size: 3.5rem;
        margin-bottom: 12px;
      }

      h3 {
        font-size: 1.3rem;
        margin-bottom: 6px;
      }

      p {
        color: var(--text-muted);
        margin-bottom: 20px;
      }
    }
  `],
})
export class ProductListComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);

  categories = signal<Category[]>([]);
  allProducts = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);

  selectedCategory = signal<string>('');
  searchQuery = '';

  selectedProductForSubscription: Product | null = null;
  isWizardOpen = false;

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();

    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.selectedCategory.set(params['category']);
      }
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      this.applyFilter();
    });
  }

  loadCategories() {
    this.api.get<Category[]>('categories').subscribe({
      next: (cats) => this.categories.set(cats || []),
      error: () => {},
    });
  }

  loadProducts() {
    this.api.get<{ products: Product[] }>('products').subscribe({
      next: (res) => {
        this.allProducts.set(res?.products || []);
        this.applyFilter();
      },
      error: () => {},
    });
  }

  selectCategory(slug: string) {
    this.selectedCategory.set(slug);
    this.applyFilter();
  }

  onSearchChange() {
    this.applyFilter();
  }

  applyFilter() {
    let prods = [...this.allProducts()];

    if (this.selectedCategory()) {
      prods = prods.filter((p) => p.category?.slug === this.selectedCategory());
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.unit.toLowerCase().includes(q),
      );
    }

    this.filteredProducts.set(prods);
  }

  clearFilters() {
    this.selectedCategory.set('');
    this.searchQuery = '';
    this.applyFilter();
  }

  openSubscriptionWizard(product: Product) {
    this.selectedProductForSubscription = product;
    this.isWizardOpen = true;
  }

  closeSubscriptionWizard() {
    this.isWizardOpen = false;
    this.selectedProductForSubscription = null;
  }
}
