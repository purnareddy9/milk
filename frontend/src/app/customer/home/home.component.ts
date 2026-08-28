import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { Product, Category } from '../../core/models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SubscriptionWizardModalComponent } from '../../shared/components/subscription-wizard/subscription-wizard.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProductCardComponent,
    SubscriptionWizardModalComponent,
    InrCurrencyPipe,
  ],
  template: `
    <div class="home-page">
      <!-- 1. Hero Promotional Section -->
      <section class="hero-section">
        <div class="container hero-inner">
          <div class="hero-content">
            <div class="hero-tag">
              <span>🌿 100% Organic Chilled Farm Milk</span>
            </div>
            <h1 class="hero-title">
              Fresh Organic Milk Delivered <span class="highlight">Before 7:00 AM</span>
            </h1>
            <p class="hero-sub">
              Untouched by human hands, 4-step chilled pasteurization, straight from local heritage farms to your doorstep every morning.
            </p>

            <div class="hero-cta-group">
              <a routerLink="/subscriptions" class="btn btn-gold btn-lg">
                🥛 Start Milk Subscription
              </a>
              <a routerLink="/products" class="btn btn-outline btn-lg">
                Explore Dairy Catalog →
              </a>
            </div>

            <!-- Trust Badges -->
            <div class="hero-trust-badges">
              <div class="trust-item">
                <span class="trust-icon">⏱️</span>
                <div class="trust-text">
                  <strong>7:00 AM Guarantee</strong>
                  <span>Morning sunrise delivery</span>
                </div>
              </div>

              <div class="trust-item">
                <span class="trust-icon">🧪</span>
                <div class="trust-text">
                  <strong>Zero Adulteration</strong>
                  <span>Daily lab tested report</span>
                </div>
              </div>

              <div class="trust-item">
                <span class="trust-icon">🔄</span>
                <div class="trust-text">
                  <strong>Flexible Controls</strong>
                  <span>Pause or skip anytime</span>
                </div>
              </div>
            </div>
          </div>

          <div class="hero-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=800&auto=format&fit=crop&q=80"
              alt="Fresh Organic A2 Milk Bottle"
              class="hero-banner-img"
            />
            <div class="floating-promo-card">
              <span class="promo-badge">🎉 Special Launch Offer</span>
              <strong>Flat ₹50 OFF + ₹120 Monthly Sub Savings</strong>
              <span>Use code: <strong>WELCOME50</strong></span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Categories Row -->
      <section class="categories-section">
        <div class="container">
          <div class="section-head">
            <div>
              <span class="sub-head">FARM FRESH SELECTION</span>
              <h2>Browse by Dairy Category</h2>
            </div>
            <a routerLink="/products" class="view-all-link">View All Products →</a>
          </div>

          <div class="categories-grid">
            <a
              *ngFor="let cat of categories()"
              [routerLink]="['/products']"
              [queryParams]="{ category: cat.slug }"
              class="category-card"
            >
              <div class="cat-img-box">
                <img [src]="cat.imageUrl" [alt]="cat.name" loading="lazy" />
              </div>
              <span class="cat-name">{{ cat.name }}</span>
            </a>
          </div>
        </div>
      </section>

      <!-- 3. How Subscription Works (3 Steps) -->
      <section class="how-it-works-section">
        <div class="container">
          <div class="how-box">
            <div class="how-header">
              <span class="badge badge-gold">SIMPLICITY FIRST</span>
              <h2>How Daily Milk Subscription Works</h2>
              <p>Fresh milk delivered every single morning with effortless flexibility.</p>
            </div>

            <div class="steps-grid">
              <div class="step-card">
                <div class="step-num">1</div>
                <div class="step-icon">🥛</div>
                <h3>Choose Your Milk</h3>
                <p>Select Farm Fresh Cow, Full Cream Buffalo, or Vedic A2 Gir Cow Milk in 500ml or 1L glass bottles.</p>
              </div>

              <div class="step-card">
                <div class="step-num">2</div>
                <div class="step-icon">📅</div>
                <h3>Set Your Schedule</h3>
                <p>Choose Daily, Alternate Days, or Custom Days. Select Morning (5:30-7:30 AM) or Evening delivery.</p>
              </div>

              <div class="step-card">
                <div class="step-num">3</div>
                <div class="step-icon">🌅</div>
                <h3>Wake Up to Freshness</h3>
                <p>Chilled milk arrives before 7:00 AM. Traveling? Pause, skip a day, or change quantity in 1 tap!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Featured Fresh Milk Products -->
      <section class="products-section">
        <div class="container">
          <div class="section-head">
            <div>
              <span class="sub-head">MORNING ESSENTIALS</span>
              <h2>Pure Cow & Buffalo Milk</h2>
            </div>
            <a routerLink="/products" [queryParams]="{ category: 'cow-milk' }" class="view-all-link">
              View All Milk →
            </a>
          </div>

          <div class="products-grid">
            <app-product-card
              *ngFor="let prod of milkProducts()"
              [product]="prod"
              (subscribeClick)="openSubscriptionWizard($event)"
            ></app-product-card>
          </div>
        </div>
      </section>

      <!-- 5. Value Added Dairy Essentials (Paneer, Curd, Ghee, Chaas) -->
      <section class="products-section alt-bg">
        <div class="container">
          <div class="section-head">
            <div>
              <span class="sub-head">HANDCRAFTED DAILY</span>
              <h2>Artisanal Paneer, Ghee & Curd</h2>
            </div>
            <a routerLink="/products" class="view-all-link">View All Essentials →</a>
          </div>

          <div class="products-grid">
            <app-product-card
              *ngFor="let prod of dairyEssentials()"
              [product]="prod"
              (subscribeClick)="openSubscriptionWizard($event)"
            ></app-product-card>
          </div>
        </div>
      </section>

      <!-- 6. Quality Certification Guarantee -->
      <section class="quality-section">
        <div class="container">
          <div class="quality-banner">
            <div class="quality-content">
              <span class="badge badge-success">THE AMRIT PROMISE</span>
              <h2>Why 10,000+ Families Choose Amrit Pure Dairy</h2>
              
              <div class="features-list">
                <div class="feature-item">
                  <span class="check-icon">✓</span>
                  <div>
                    <strong>Untouched by Human Hands:</strong>
                    <span>Milked via automated hygienic European cluster milking parlors.</span>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="check-icon">✓</span>
                  <div>
                    <strong>4°C Chilled Cold Chain:</strong>
                    <span>Chilled within 45 minutes of milking to preserve natural nutrients and probiotics.</span>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="check-icon">✓</span>
                  <div>
                    <strong>Zero Hormones or Antibiotics:</strong>
                    <span>Cows fed organically grown green fodder, alfalfa, and pure well water.</span>
                  </div>
                </div>

                <div class="feature-item">
                  <span class="check-icon">✓</span>
                  <div>
                    <strong>Eco-Friendly Packaging:</strong>
                    <span>Reusable sterilized glass bottles and recyclable food-grade pouches.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="quality-image">
              <img
                src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80"
                alt="Glass milk bottles on morning farm table"
                class="quality-img"
              />
            </div>
          </div>
        </div>
      </section>

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
    .home-page {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    /* Hero Section */
    .hero-section {
      background: linear-gradient(180deg, #f0f7f3 0%, var(--bg-app) 100%);
      padding: 48px 0 32px;
    }

    .hero-inner {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 40px;
      align-items: center;
    }

    .hero-tag {
      display: inline-block;
      background-color: var(--primary-subtle);
      color: var(--primary);
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-weight: 700;
      font-size: 0.825rem;
      margin-bottom: 16px;
    }

    .hero-title {
      font-size: 2.75rem;
      color: var(--text-main);
      margin-bottom: 16px;
      line-height: 1.15;

      .highlight {
        color: var(--primary);
        position: relative;
        display: inline-block;
      }
    }

    .hero-sub {
      font-size: 1.1rem;
      color: var(--text-muted);
      margin-bottom: 28px;
      line-height: 1.6;
      max-width: 540px;
    }

    .hero-cta-group {
      display: flex;
      gap: 16px;
      margin-bottom: 36px;
      flex-wrap: wrap;
    }

    .hero-trust-badges {
      display: flex;
      gap: 24px;
      border-top: 1px solid var(--border-subtle);
      padding-top: 24px;
      flex-wrap: wrap;
    }

    .trust-item {
      display: flex;
      align-items: center;
      gap: 10px;

      .trust-icon {
        font-size: 1.6rem;
      }

      .trust-text {
        display: flex;
        flex-direction: column;

        strong {
          font-size: 0.875rem;
          color: var(--text-main);
        }

        span {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }
    }

    .hero-image-wrap {
      position: relative;

      .hero-banner-img {
        width: 100%;
        height: 420px;
        object-fit: cover;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
      }

      .floating-promo-card {
        position: absolute;
        bottom: -20px;
        left: 20px;
        right: 20px;
        background: #ffffff;
        padding: 16px 20px;
        border-radius: var(--radius-md);
        box-shadow: 0 12px 32px rgba(27, 67, 50, 0.18);
        border: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        gap: 4px;

        .promo-badge {
          font-size: 0.725rem;
          font-weight: 800;
          color: var(--butter-dark);
        }

        strong {
          font-size: 0.95rem;
          color: var(--text-main);
        }

        span {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      }
    }

    /* Section Headings */
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;

      .sub-head {
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--primary-accent);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: block;
        margin-bottom: 4px;
      }

      h2 {
        font-size: 1.75rem;
      }

      .view-all-link {
        font-weight: 700;
        color: var(--primary);
        font-size: 0.9rem;
        &:hover { text-decoration: underline; }
      }
    }

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 16px;
    }

    .category-card {
      background-color: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-3px);
        border-color: var(--primary);
        box-shadow: var(--shadow-md);
      }

      .cat-img-box {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        overflow: hidden;
        margin-bottom: 10px;
        background-color: var(--bg-app);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .cat-name {
        font-weight: 700;
        font-size: 0.825rem;
        color: var(--text-main);
      }
    }

    /* How it works */
    .how-box {
      background: linear-gradient(135deg, var(--primary) 0%, #143527 100%);
      color: #ffffff;
      border-radius: var(--radius-lg);
      padding: 48px 36px;

      .how-header {
        text-align: center;
        max-width: 600px;
        margin: 0 auto 36px;

        h2 {
          color: #ffffff;
          font-size: 2rem;
          margin: 10px 0 8px;
        }

        p {
          color: var(--primary-subtle);
          font-size: 1rem;
        }
      }
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .step-card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      padding: 24px;
      position: relative;

      .step-num {
        position: absolute;
        top: 14px;
        right: 16px;
        font-size: 1.4rem;
        font-weight: 800;
        color: var(--butter-gold);
        opacity: 0.7;
      }

      .step-icon {
        font-size: 2rem;
        margin-bottom: 12px;
      }

      h3 {
        color: #ffffff;
        font-size: 1.15rem;
        margin-bottom: 8px;
      }

      p {
        color: var(--primary-subtle);
        font-size: 0.875rem;
        line-height: 1.5;
      }
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 24px;
    }

    .products-section.alt-bg {
      background-color: var(--cream-bg);
      padding: 48px 0;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
    }

    /* Quality Promise */
    .quality-banner {
      background-color: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 40px;
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 40px;
      align-items: center;

      h2 {
        font-size: 1.8rem;
        margin: 10px 0 20px;
      }

      .features-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .feature-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;

        .check-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: var(--primary-subtle);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          flex-shrink: 0;
        }

        strong {
          color: var(--text-main);
          font-size: 0.95rem;
          display: block;
        }

        span {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
      }

      .quality-img {
        width: 100%;
        height: 320px;
        object-fit: cover;
        border-radius: var(--radius-md);
      }
    }

    @media (max-width: 900px) {
      .hero-inner { grid-template-columns: 1fr; }
      .steps-grid { grid-template-columns: 1fr; }
      .quality-banner { grid-template-columns: 1fr; }
      .hero-title { font-size: 2.2rem; }
    }
  `],
})
export class HomeComponent implements OnInit {
  api = inject(ApiService);
  router = inject(Router);

  categories = signal<Category[]>([]);
  allProducts = signal<Product[]>([]);
  milkProducts = signal<Product[]>([]);
  dairyEssentials = signal<Product[]>([]);

  selectedProductForSubscription: Product | null = null;
  isWizardOpen = false;

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
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
        const prods = res?.products || [];
        this.allProducts.set(prods);

        const milks = prods.filter((p) => p.category?.slug?.includes('milk'));
        const essentials = prods.filter((p) => !p.category?.slug?.includes('milk'));

        this.milkProducts.set(milks.slice(0, 4));
        this.dairyEssentials.set(essentials.slice(0, 4));
      },
      error: () => {},
    });
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
