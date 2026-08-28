import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models';
import { SubscriptionWizardModalComponent } from '../../../shared/components/subscription-wizard/subscription-wizard.component';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { MilkUnitPipe } from '../../../shared/pipes/milk-unit.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SubscriptionWizardModalComponent,
    InrCurrencyPipe,
    MilkUnitPipe,
  ],
  template: `
    <div class="container product-detail-page" *ngIf="product() as p">
      <!-- Breadcrumb -->
      <div class="breadcrumb-nav">
        <a routerLink="/">Home</a> / 
        <a routerLink="/products">Products</a> / 
        <span class="curr-page">{{ p.name }}</span>
      </div>

      <!-- Main Detail Layout -->
      <div class="detail-grid">
        <!-- Left: Image & Badges -->
        <div class="detail-media">
          <div class="main-image-box card">
            <img [src]="p.imageUrl" [alt]="p.name" class="main-img" />
            
            <div class="media-badges">
              <span class="badge badge-success" *ngIf="p.isOrganic">🌿 100% Farm Pure</span>
              <span class="badge badge-gold" *ngIf="p.isFeatured">⭐ Top Subscriber Choice</span>
            </div>
          </div>
        </div>

        <!-- Right: Information & Actions -->
        <div class="detail-info">
          <span class="category-title">{{ p.category?.name }}</span>
          <h1 class="product-name">{{ p.name }}</h1>
          <p class="description">{{ p.description }}</p>

          <!-- Specifications Badges -->
          <div class="spec-pills">
            <div class="spec-pill" *ngIf="p.fatPercent">
              <span class="spec-label">Natural Fat:</span>
              <strong>{{ p.fatPercent }}%</strong>
            </div>

            <div class="spec-pill" *ngIf="p.snfPercent">
              <span class="spec-label">SNF:</span>
              <strong>{{ p.snfPercent }}%</strong>
            </div>

            <div class="spec-pill">
              <span class="spec-label">Pack Size:</span>
              <strong>{{ p.unit | milkUnit }}</strong>
            </div>

            <div class="spec-pill">
              <span class="spec-label">Fresh Shelf Life:</span>
              <strong>{{ p.shelfLifeDays }} Days</strong>
            </div>
          </div>

          <!-- Purchase Options Cards -->
          <div class="purchase-options">
            <!-- Option 1: Subscription (Highlighted) -->
            <div class="purchase-card sub-card selected">
              <div class="card-header-row">
                <div class="plan-title">
                  <span class="sub-icon">🥛</span>
                  <div>
                    <strong>Daily Subscription Delivery</strong>
                    <span>Delivered fresh every morning before 7:00 AM</span>
                  </div>
                </div>
                <div class="plan-price">
                  <span class="amt">{{ p.subscriptionPrice | inrCurrency }}</span>
                  <small>/ delivery</small>
                </div>
              </div>

              <div class="savings-tag">
                <span>🎉 Save {{ (p.price - p.subscriptionPrice) * 30 | inrCurrency }} every month with Daily plan</span>
              </div>

              <button class="btn btn-gold btn-block" (click)="openWizard()">
                ✨ Start Milk Subscription
              </button>
            </div>

            <!-- Option 2: One-Time Instant Order -->
            <div class="purchase-card instant-card">
              <div class="card-header-row">
                <div>
                  <strong>One-Time Instant Order</strong>
                  <span>Delivered on selected date</span>
                </div>
                <div class="plan-price">
                  <span class="amt">{{ p.price | inrCurrency }}</span>
                </div>
              </div>

              <div class="instant-action-row">
                <div class="qty-stepper large">
                  <button (click)="decreaseQty()">−</button>
                  <span class="qty-val">{{ quantity() }}</span>
                  <button (click)="increaseQty()">+</button>
                </div>

                <button class="btn btn-primary add-cart-btn" (click)="addToCart()">
                  🛒 Add to Cart ({{ p.price * quantity() | inrCurrency }})
                </button>
              </div>
            </div>
          </div>

          <!-- Delivery Slot Banner -->
          <div class="delivery-guarantee-box">
            <span class="dg-icon">🌅</span>
            <div class="dg-text">
              <strong>Morning Delivery Guaranteed Before 7:00 AM</strong>
              <span>Order before 10:00 PM tonight to receive at your door tomorrow morning.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Details: Nutrition & Sourcing Tabs -->
      <div class="detail-sections">
        <div class="section-card card">
          <h2>🌱 Farm Origin & Gentle Processing</h2>
          <p class="section-text">
            Our cows and buffaloes graze in pristine open pastures and are fed organic, chemical-free green fodder. Milked hygienically at 4:30 AM, chilled within 45 minutes to 4°C, and minimally pasteurized to preserve the wholesome natural taste and immunity-boosting carotenoids.
          </p>
          <div class="storage-box" *ngIf="p.storageInfo">
            <strong>Storage Guidelines:</strong> {{ p.storageInfo }}
          </div>
        </div>

        <div class="section-card card" *ngIf="nutritionData()">
          <h2>🧪 Nutritional Facts (per 100ml)</h2>
          <div class="nutrition-grid">
            <div class="nutri-item" *ngFor="let item of nutritionData()">
              <span class="nutri-label">{{ item.label }}</span>
              <strong class="nutri-value">{{ item.value }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscription Wizard Modal -->
      <app-subscription-wizard
        *ngIf="p"
        [product]="p"
        [isOpen]="isWizardOpen"
        (closeWizard)="closeWizard()"
      ></app-subscription-wizard>
    </div>
  `,
  styles: [`
    .product-detail-page {
      padding: 32px 20px 60px;
    }

    .breadcrumb-nav {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 24px;

      a {
        color: var(--primary);
        font-weight: 600;
        &:hover { text-decoration: underline; }
      }

      .curr-page {
        color: var(--text-main);
        font-weight: 700;
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 48px;
      margin-bottom: 48px;
    }

    .main-image-box {
      position: relative;
      width: 100%;
      height: 480px;
      overflow: hidden;
      border-radius: var(--radius-lg);

      .main-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .media-badges {
        position: absolute;
        top: 16px;
        left: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
    }

    .category-title {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--primary-accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 4px;
    }

    .product-name {
      font-size: 2.2rem;
      margin-bottom: 12px;
      line-height: 1.2;
    }

    .description {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .spec-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 28px;

      .spec-pill {
        background-color: var(--bg-app);
        border: 1px solid var(--border-subtle);
        padding: 6px 14px;
        border-radius: var(--radius-md);
        font-size: 0.825rem;

        .spec-label {
          color: var(--text-muted);
          margin-right: 4px;
        }

        strong {
          color: var(--text-main);
        }
      }
    }

    .purchase-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .purchase-card {
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      background: #ffffff;
      transition: all 0.2s ease;

      &.sub-card {
        border-color: var(--butter-gold);
        background: linear-gradient(180deg, #fffdf8 0%, #fff9ec 100%);
        box-shadow: 0 4px 16px rgba(188, 108, 37, 0.12);
      }

      .card-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        strong {
          font-size: 1.05rem;
          color: var(--text-main);
          display: block;
        }

        span {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      }

      .plan-title {
        display: flex;
        align-items: center;
        gap: 12px;

        .sub-icon {
          font-size: 1.6rem;
        }
      }

      .plan-price {
        text-align: right;

        .amt {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--primary);
        }

        small {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }

      .savings-tag {
        background-color: var(--gold-badge);
        color: var(--butter-dark);
        font-size: 0.775rem;
        font-weight: 700;
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        margin-bottom: 16px;
        display: inline-block;
      }

      .instant-action-row {
        display: flex;
        gap: 12px;
        align-items: center;

        .add-cart-btn {
          flex: 1;
        }
      }
    }

    .delivery-guarantee-box {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background-color: var(--primary-subtle);
      border-radius: var(--radius-md);
      color: var(--primary);

      .dg-icon {
        font-size: 1.6rem;
      }

      .dg-text {
        display: flex;
        flex-direction: column;

        strong {
          font-size: 0.9rem;
        }

        span {
          font-size: 0.775rem;
          opacity: 0.85;
        }
      }
    }

    .detail-sections {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .section-card {
      padding: 28px;

      h2 {
        font-size: 1.25rem;
        margin-bottom: 14px;
      }

      .section-text {
        font-size: 0.9rem;
        color: var(--text-muted);
        line-height: 1.6;
        margin-bottom: 14px;
      }

      .storage-box {
        font-size: 0.85rem;
        background-color: var(--bg-app);
        padding: 10px 14px;
        border-radius: var(--radius-sm);
        color: var(--text-body);
      }
    }

    .nutrition-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      .nutri-item {
        background-color: var(--bg-app);
        padding: 12px;
        border-radius: var(--radius-md);
        text-align: center;
        display: flex;
        flex-direction: column;

        .nutri-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .nutri-value {
          font-size: 1rem;
          color: var(--primary);
        }
      }
    }

    @media (max-width: 900px) {
      .detail-grid { grid-template-columns: 1fr; }
      .detail-sections { grid-template-columns: 1fr; }
      .main-image-box { height: 320px; }
    }
  `],
})
export class ProductDetailComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  cartService = inject(CartService);

  product = signal<Product | null>(null);
  quantity = signal<number>(1);
  isWizardOpen = false;

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const slugOrId = params['slug'];
      if (slugOrId) {
        this.loadProduct(slugOrId);
      }
    });
  }

  loadProduct(slug: string) {
    this.api.get<Product>(`products/${slug}`).subscribe({
      next: (prod) => this.product.set(prod),
      error: () => {},
    });
  }

  increaseQty() {
    this.quantity.set(this.quantity() + 1);
  }

  decreaseQty() {
    if (this.quantity() > 1) {
      this.quantity.set(this.quantity() - 1);
    }
  }

  nutritionData(): { label: string; value: string }[] | null {
    const raw = this.product()?.nutritionInfo;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return Object.keys(parsed).map((k) => ({
        label: k.charAt(0).toUpperCase() + k.slice(1),
        value: parsed[k],
      }));
    } catch {
      return null;
    }
  }

  addToCart() {
    const p = this.product();
    if (p) {
      this.cartService.addToCart(p, this.quantity());
    }
  }

  openWizard() {
    this.isWizardOpen = true;
  }

  closeWizard() {
    this.isWizardOpen = false;
  }
}
