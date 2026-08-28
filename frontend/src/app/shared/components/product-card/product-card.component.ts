import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../../core/models';
import { CartService } from '../../../core/services/cart.service';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../pipes/milk-unit.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe, MilkUnitPipe],
  template: `
    <div class="product-card card card-hover">
      <!-- Image & Badges -->
      <div class="card-media" (click)="viewDetails()">
        <img [src]="product.imageUrl" [alt]="product.name" loading="lazy" class="prod-img" />
        
        <div class="media-badges">
          <span class="badge badge-success" *ngIf="product.isOrganic">🌿 100% Farm Pure</span>
          <span class="badge badge-gold" *ngIf="product.isFeatured">⭐ Best Seller</span>
        </div>

        <div class="fat-badge" *ngIf="product.fatPercent">
          <span>{{ product.fatPercent }}% Fat</span>
          <span *ngIf="product.snfPercent">| {{ product.snfPercent }}% SNF</span>
        </div>
      </div>

      <!-- Content -->
      <div class="card-body">
        <div class="category-tag">{{ product.category?.name || 'Pure Dairy' }}</div>
        <h3 class="prod-title" (click)="viewDetails()">{{ product.name }}</h3>
        
        <div class="pack-size">
          <span class="unit-pill">📦 {{ product.unit | milkUnit }}</span>
          <span class="shelf-pill" *ngIf="product.shelfLifeDays">⏳ {{ product.shelfLifeDays }} Days Fresh</span>
        </div>

        <!-- Pricing Section -->
        <div class="price-grid">
          <div class="instant-price">
            <span class="price-label">One-Time</span>
            <span class="price-val">{{ product.price | inrCurrency }}</span>
          </div>

          <div class="sub-price">
            <span class="price-label">Subscribe</span>
            <span class="sub-val">{{ product.subscriptionPrice | inrCurrency }}<small>/day</small></span>
          </div>
        </div>

        <div class="savings-banner" *ngIf="product.price > product.subscriptionPrice">
          <span>🎉 Save {{ (product.price - product.subscriptionPrice) * 30 | inrCurrency }}/month on daily sub</span>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <div class="qty-stepper">
            <button (click)="decreaseQty()">−</button>
            <span class="qty-val">{{ qty() }}</span>
            <button (click)="increaseQty()">+</button>
          </div>

          <button class="btn btn-primary btn-sm add-btn" (click)="addToCart()">
            🛒 Add
          </button>

          <button class="btn btn-gold btn-sm sub-btn" (click)="openSubscribe()">
            🥛 Sub
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }

    .card-media {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      cursor: pointer;
      background-color: var(--primary-subtle);

      .prod-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }

      &:hover .prod-img {
        transform: scale(1.06);
      }
    }

    .media-badges {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .fat-badge {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(20, 28, 24, 0.85);
      backdrop-filter: blur(4px);
      color: #ffffff;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.725rem;
      font-weight: 700;
    }

    .card-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .category-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary-accent);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    .prod-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 8px;
      cursor: pointer;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;

      &:hover {
        color: var(--primary);
      }
    }

    .pack-size {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
    }

    .unit-pill, .shelf-pill {
      font-size: 0.75rem;
      font-weight: 600;
      background-color: var(--bg-app);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      color: var(--text-body);
      border: 1px solid var(--border-subtle);
    }

    .price-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 10px;
      background-color: var(--bg-app);
      border-radius: var(--radius-md);
      margin-bottom: 10px;
    }

    .price-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      display: block;
      font-weight: 600;
    }

    .price-val {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .sub-val {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--primary);

      small {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-muted);
      }
    }

    .savings-banner {
      background-color: var(--cream-surface);
      border: 1px dashed var(--butter-gold);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--butter-dark);
      margin-bottom: 14px;
      text-align: center;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: auto;
    }

    .add-btn {
      flex: 1;
    }

    .sub-btn {
      flex: 1;
    }
  `],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() subscribeClick = new EventEmitter<Product>();

  cartService = inject(CartService);
  router = inject(Router);

  qty = signal<number>(1);

  increaseQty() {
    this.qty.set(this.qty() + 1);
  }

  decreaseQty() {
    if (this.qty() > 1) {
      this.qty.set(this.qty() - 1);
    }
  }

  viewDetails() {
    this.router.navigate(['/products', this.product.slug]);
  }

  addToCart() {
    this.cartService.addToCart(this.product, this.qty());
  }

  openSubscribe() {
    this.subscribeClick.emit(this.product);
  }
}
