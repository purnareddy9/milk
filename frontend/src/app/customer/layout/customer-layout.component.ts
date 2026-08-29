import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CartDrawerComponent } from '../../shared/components/cart-drawer/cart-drawer.component';
import { PersonaSwitcherComponent } from '../../shared/components/persona-switcher/persona-switcher.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { AuthModalComponent } from '../../shared/components/auth-modal/auth-modal.component';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CartDrawerComponent,
    PersonaSwitcherComponent,
    ToastContainerComponent,
    AuthModalComponent,
    InrCurrencyPipe,
  ],
  template: `
    <div class="customer-app-shell">
      <!-- Top Announcement Bar -->
      <div class="top-announcement">
        <div class="container announcement-inner">
          <span>🥛 <strong>Pure Farm Milk:</strong> Order before 10:00 PM for guaranteed delivery tomorrow before 7:00 AM!</span>
          <div class="top-links">
            <span class="delivery-badge">🚚 Sector 1-25 Covered</span>
            <span class="fssai-pill">FSSAI Certified #10822005000124</span>
          </div>
        </div>
      </div>

      <!-- Main Navigation Header -->
      <header class="main-header">
        <div class="container header-inner">
          <!-- Brand Logo -->
          <a routerLink="/" class="brand-logo">
            <div class="logo-emblem">🥛</div>
            <div class="logo-text">
              <span class="brand-name">AMRIT PURE</span>
              <span class="brand-sub">DAIRY & ORGANIC FARMS</span>
            </div>
          </a>

          <!-- Location Selector -->
          <div class="location-picker" (click)="openAddressModal()">
            <span class="loc-icon">📍</span>
            <div class="loc-details">
              <span class="loc-label">Delivering to</span>
              <span class="loc-value">{{ selectedAddressName() }} ▼</span>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="header-search">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
              placeholder="Search cow milk, buffalo milk, curd, paneer, bilona ghee..."
              class="search-input"
            />
            <button class="search-btn" (click)="onSearch()">🔍</button>
          </div>

          <!-- Header Right Actions -->
          <div class="header-actions">
            <!-- Desktop-Only Shortcuts (Authenticated Users Only) -->
            <ng-container *ngIf="auth.currentUser">
              <!-- Notifications Bell -->
              <a routerLink="/notifications" class="action-btn notif-btn desktop-only-action" title="Notifications">
                <span>🔔</span>
              </a>

              <!-- Subscriptions Shortcut -->
              <a routerLink="/subscriptions" class="action-btn sub-shortcut desktop-only-action" title="My Subscriptions">
                <span class="sub-icon">📅</span>
                <span class="action-text">Subscriptions</span>
              </a>

              <!-- Orders Shortcut -->
              <a routerLink="/orders" class="action-btn order-shortcut desktop-only-action" title="My Orders">
                <span class="order-icon">📦</span>
                <span class="action-text">Orders</span>
              </a>

              <!-- Milk Wallet Pill -->
              <a routerLink="/payments" class="wallet-pill" title="Milk Wallet">
                <span class="wallet-icon">💰</span>
                <span class="wallet-amt">{{ (auth.currentUser?.walletBalance || 0) | inrCurrency }}</span>
              </a>
            </ng-container>

            <!-- User Account Button / Dropdown (Logged In) -->
            <div class="user-account-wrapper" *ngIf="auth.currentUser; else guestSignInBlock">
              <button class="user-action-pill" (click)="toggleProfileMenu()">
                <span class="user-icon">{{ auth.currentUser?.role === 'SELLER' ? '👑' : auth.currentUser?.role === 'DELIVERY_PERSON' ? '🛵' : '🧑‍💼' }}</span>
                <span class="user-name-text">{{ auth.currentUser?.name?.split(' ')[0] }}</span>
                <span class="caret-icon">▾</span>
              </button>

              <div class="user-popover-menu" *ngIf="showProfileMenu()">
                <div class="popover-user-info">
                  <strong>{{ auth.currentUser?.name }}</strong>
                  <span class="popover-email">{{ auth.currentUser?.email }}</span>
                  <span class="popover-role-badge">{{ auth.currentUser?.role }}</span>
                </div>
                <div class="popover-divider"></div>
                <a routerLink="/profile" class="popover-item" (click)="showProfileMenu.set(false)">
                  <span class="item-icon">👤</span> My Profile & Settings
                </a>
                <a routerLink="/subscriptions" class="popover-item" (click)="showProfileMenu.set(false)">
                  <span class="item-icon">🥛</span> My Milk Subscriptions
                </a>
                <a routerLink="/orders" class="popover-item" (click)="showProfileMenu.set(false)">
                  <span class="item-icon">📦</span> Track Orders
                </a>
                <a routerLink="/payments" class="popover-item" (click)="showProfileMenu.set(false)">
                  <span class="item-icon">💰</span> Milk Wallet Top-up
                </a>
                <a routerLink="/addresses" class="popover-item" (click)="showProfileMenu.set(false)">
                  <span class="item-icon">📍</span> Saved Addresses
                </a>
                <div class="popover-divider" *ngIf="auth.isSeller || auth.isDeliveryPerson"></div>
                <a routerLink="/seller/dashboard" class="popover-item seller-highlight" *ngIf="auth.isSeller" (click)="showProfileMenu.set(false)">
                  <span class="item-icon">👑</span> Seller Operations Hub
                </a>
                <a routerLink="/delivery-partner" class="popover-item deliv-highlight" *ngIf="auth.isDeliveryPerson" (click)="showProfileMenu.set(false)">
                  <span class="item-icon">🛵</span> Delivery Partner Run-Sheet
                </a>
                <button type="button" class="popover-item logout-btn" (click)="logout()">
                  <span class="item-icon">🚪</span> Sign Out
                </button>
              </div>
            </div>

            <!-- Guest Sign In Button -->
            <ng-template #guestSignInBlock>
              <button class="user-action-pill guest-btn" (click)="openAuthModal()">
                <span class="user-icon">👤</span>
                <span class="user-name-text">Sign In</span>
              </button>
            </ng-template>

            <!-- Cart Trigger Pill -->
            <button class="cart-pill" (click)="cartService.toggleCartDrawer(true)">
              <div class="cart-icon-wrap">
                🛒
                <span class="cart-badge" *ngIf="cartService.cartSignal().itemCount > 0">
                  {{ cartService.cartSignal().itemCount }}
                </span>
              </div>
              <div class="cart-meta" *ngIf="cartService.cartSignal().itemCount > 0">
                <span class="cart-total">{{ cartService.cartSignal().subtotal | inrCurrency }}</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Page Content -->
      <main class="app-main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Customer Footer -->
      <footer class="app-footer">
        <div class="container footer-inner">
          <div class="footer-col brand-col">
            <div class="footer-logo">
              <span class="logo-emblem">🥛</span>
              <span class="brand-name">AMRIT PURE DAIRY</span>
            </div>
            <p class="footer-desc">
              Dedicated to bringing untouched, farm-fresh organic A2 cow milk, buffalo milk, bilona ghee, and handcrafted paneer directly to your family's doorstep every sunrise.
            </p>
            <div class="fssai-box">
              <span>🌿 100% Zero Preservatives & Chemical Free</span>
            </div>
          </div>

          <div class="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a routerLink="/products">Daily Milk & Dairy</a></li>
              <li><a routerLink="/subscriptions">Milk Subscriptions</a></li>
              <li><a routerLink="/orders">Track Live Order</a></li>
              <li><a routerLink="/payments">Milk Wallet</a></li>
              <li><a routerLink="/addresses">Delivery Addresses</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Dairy Categories</h4>
            <ul>
              <li><a routerLink="/products" [queryParams]="{category: 'cow-milk'}">Fresh Cow Milk</a></li>
              <li><a routerLink="/products" [queryParams]="{category: 'buffalo-milk'}">Full Cream Buffalo Milk</a></li>
              <li><a routerLink="/products" [queryParams]="{category: 'a2-milk'}">Vedic A2 Gir Milk</a></li>
              <li><a routerLink="/products" [queryParams]="{category: 'paneer'}">Fresh Malai Paneer</a></li>
              <li><a routerLink="/products" [queryParams]="{category: 'ghee'}">Vedic Bilona Ghee</a></li>
            </ul>
          </div>

          <div class="footer-col contact-col">
            <h4>Morning Support</h4>
            <p>📞 Phone: +91 98765 43210</p>
            <p>📧 Email: care&#64;amritpuredairy.com</p>
            <p>⏰ Morning Delivery: 5:30 AM – 7:30 AM</p>
            <p>📍 Farms: Village Chhatarpur, Dairy Zone 4</p>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="container bottom-inner">
            <span>© 2026 Amrit Pure Dairy Platform. All rights reserved.</span>
            <div class="bottom-links" *ngIf="auth.isSeller">
              <a routerLink="/seller/dashboard" class="seller-admin-link">👑 Dairy Owner / Seller Portal →</a>
            </div>
          </div>
        </div>
      </footer>

      <!-- Mobile Bottom Navigation Bar (Auth-Aware) -->
      <nav class="mobile-bottom-nav">
        <!-- Tab 1: Home -->
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Home</span>
        </a>

        <!-- Tab 2: Dairy Products -->
        <a routerLink="/products" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🥛</span>
          <span class="nav-label">Dairy</span>
        </a>

        <!-- GUEST TABS (Unauthenticated User) -->
        <ng-container *ngIf="!auth.currentUser">
          <!-- Tab 3: Milk Requirement Calculator -->
          <a routerLink="/milk-requirement" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📋</span>
            <span class="nav-label">Milk Plan</span>
          </a>

          <!-- Tab 4: Direct Sign In Trigger -->
          <button type="button" class="nav-item nav-btn" (click)="openAuthModal()">
            <span class="nav-icon">👤</span>
            <span class="nav-label">Sign In</span>
          </button>
        </ng-container>

        <!-- AUTHENTICATED TABS (Logged In User) -->
        <ng-container *ngIf="auth.currentUser">
          <!-- Tab 3: Subscriptions -->
          <a routerLink="/subscriptions" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📅</span>
            <span class="nav-label">Subscribe</span>
          </a>

          <!-- Tab 4: Orders -->
          <a routerLink="/orders" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📦</span>
            <span class="nav-label">Orders</span>
          </a>

          <!-- Tab 5: Account Profile -->
          <a routerLink="/profile" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👤</span>
            <span class="nav-label">Account</span>
          </a>
        </ng-container>
      </nav>

      <!-- Cart Slide-Over Drawer -->
      <app-cart-drawer></app-cart-drawer>

      <!-- Demo Persona Switcher -->
      <app-persona-switcher></app-persona-switcher>

      <!-- Toast Notifications -->
      <app-toast-container></app-toast-container>

      <!-- Auth Modal -->
      <app-auth-modal [(isOpen)]="showAuthModal"></app-auth-modal>
    </div>
  `,
  styles: [`
    .customer-app-shell {
      min-height: 100vh;
      width: 100%;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-app);
      padding-bottom: calc(var(--mobile-nav-height) + 12px);

      @media (min-width: 769px) {
        padding-bottom: 0;
      }
    }

    .top-announcement {
      background-color: var(--primary);
      color: #ffffff;
      font-size: 0.8rem;
      padding: 6px 0;

      .announcement-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .top-links {
        display: flex;
        gap: 12px;
      }

      .delivery-badge {
        background: rgba(255, 255, 255, 0.15);
        padding: 2px 8px;
        border-radius: var(--radius-full);
      }

      .fssai-pill {
        color: var(--primary-subtle);
      }

      @media (max-width: 768px) {
        .top-links { display: none; }
        .announcement-inner { justify-content: center; text-align: center; font-size: 0.75rem; }
      }
    }

    .main-header {
      background-color: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 8000;
      box-shadow: var(--shadow-sm);
      width: 100%;
    }

    .header-inner {
      height: var(--header-height);
      display: flex;
      align-items: center;
      gap: 16px;
      justify-content: space-between;

      @media (max-width: 480px) {
        gap: 8px;
        height: 60px;
      }
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;

      .logo-emblem {
        font-size: 1.8rem;
        line-height: 1;
      }

      .logo-text {
        display: flex;
        flex-direction: column;
      }

      .brand-name {
        font-family: var(--font-heading);
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--primary);
        letter-spacing: 0.02em;
        line-height: 1.1;
      }

      .brand-sub {
        font-size: 0.62rem;
        font-weight: 700;
        color: var(--butter-dark);
        letter-spacing: 0.06em;
      }

      @media (max-width: 480px) {
        gap: 6px;
        .logo-emblem { font-size: 1.4rem; }
        .brand-name { font-size: 1.05rem; }
        .brand-sub { font-size: 0.52rem; letter-spacing: 0.02em; }
      }

      @media (max-width: 350px) {
        .brand-name { font-size: 0.95rem; }
        .brand-sub { display: none; }
      }
    }

    .location-picker {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background-color: var(--bg-app);
      border-radius: var(--radius-md);
      cursor: pointer;
      border: 1px solid var(--border-subtle);
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--primary);
      }

      .loc-details {
        display: flex;
        flex-direction: column;
      }

      .loc-label {
        font-size: 0.68rem;
        color: var(--text-muted);
        font-weight: 600;
      }

      .loc-value {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-main);
      }

      @media (max-width: 1024px) {
        display: none;
      }
    }

    .header-search {
      flex: 1;
      position: relative;
      max-width: 520px;

      .search-input {
        width: 100%;
        padding: 10px 44px 10px 16px;
        border-radius: var(--radius-full);
        border: 1.5px solid var(--border-subtle);
        background-color: var(--bg-app);
        font-size: 0.9rem;
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          border-color: var(--primary);
          background-color: #ffffff;
          box-shadow: 0 0 0 3px var(--primary-glow);
        }
      }

      .search-btn {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1rem;
        opacity: 0.7;
        &:hover { opacity: 1; }
      }

      @media (max-width: 768px) {
        display: none;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
      flex-shrink: 0;

      @media (max-width: 768px) {
        .desktop-only-action {
          display: none !important;
        }
      }

      @media (max-width: 480px) {
        gap: 6px;
      }
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-body);
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--bg-app);
        color: var(--primary);
      }

      @media (max-width: 900px) {
        .action-text { display: none; }
      }
    }

    .wallet-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      background-color: var(--cream-surface);
      border: 1px solid var(--butter-gold);
      border-radius: var(--radius-full);
      font-weight: 700;
      font-size: 0.8rem;
      color: var(--butter-dark);
      transition: all 0.2s ease;

      &:hover {
        filter: brightness(1.03);
      }

      @media (max-width: 520px) {
        display: none;
      }
    }

    .cart-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background-color: var(--primary);
      color: #ffffff;
      border-radius: var(--radius-full);
      box-shadow: 0 4px 14px rgba(27, 67, 50, 0.25);
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--primary-hover);
        transform: translateY(-1px);
      }

      .cart-icon-wrap {
        position: relative;
        font-size: 1.15rem;
        display: flex;
        align-items: center;
      }

      .cart-badge {
        position: absolute;
        top: -8px;
        right: -10px;
        background-color: var(--butter-gold);
        color: #ffffff;
        font-size: 0.7rem;
        font-weight: 800;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cart-total {
        font-weight: 700;
        font-size: 0.85rem;
      }

      @media (max-width: 480px) {
        padding: 7px 10px;
        .cart-total { display: none; }
      }
    }

    .app-main-content {
      flex: 1;
      width: 100%;
    }

    .app-footer {
      background-color: #ffffff;
      border-top: 1px solid var(--border-subtle);
      margin-top: 60px;
      padding-top: 48px;

      .footer-inner {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1.5fr;
        gap: 40px;
        margin-bottom: 40px;
      }

      .brand-col {
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          font-weight: 800;
          font-size: 1.15rem;
          color: var(--primary);
        }

        .footer-desc {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .fssai-box {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--primary);
          background-color: var(--primary-subtle);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          display: inline-block;
        }
      }

      h4 {
        font-size: 0.95rem;
        margin-bottom: 16px;
        color: var(--text-main);
      }

      ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 10px;

        li a {
          font-size: 0.875rem;
          color: var(--text-muted);
          transition: color 0.2s ease;

          &:hover {
            color: var(--primary);
          }
        }
      }

      .contact-col p {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin-bottom: 8px;
      }

      .footer-bottom {
        border-top: 1px solid var(--border-subtle);
        padding: 20px 0;
        background-color: var(--bg-app);

        .bottom-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.825rem;
          color: var(--text-muted);
        }

        .seller-admin-link {
          font-weight: 700;
          color: var(--primary);
          &:hover { text-decoration: underline; }
        }
      }

      @media (max-width: 900px) {
        .footer-inner {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 600px) {
        .footer-inner {
          grid-template-columns: 1fr;
          gap: 28px;
        }
      }
    }

    /* Mobile Bottom Navigation */
    .mobile-bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--mobile-nav-height);
      background-color: #ffffff;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-around;
      z-index: 8500;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);

      @media (min-width: 769px) {
        display: none;
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 600;
        flex: 1;
        min-width: 0;
        height: 100%;
        transition: color 0.2s ease;
        text-align: center;
        text-decoration: none;

        .nav-icon {
          font-size: 1.25rem;
          line-height: 1;
        }

        .nav-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        &.active {
          color: var(--primary);
          font-weight: 700;
        }

        &.nav-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .user-account-wrapper {
      position: relative;
    }

    .user-action-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      border-radius: var(--radius-full, 9999px);
      font-size: 0.85rem;
      font-weight: 700;
      color: #1E293B;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #E8F5E9;
        border-color: #A7F3D0;
      }

      .user-icon { font-size: 1rem; }
      .user-name-text { max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .caret-icon { font-size: 0.75rem; color: #64748B; }

      @media (max-width: 480px) {
        padding: 6px 8px;
        font-size: 0.8rem;
        .user-name-text { max-width: 55px; }
      }

      @media (max-width: 340px) {
        .user-name-text { display: none; }
        .caret-icon { display: none; }
      }
    }

    .user-popover-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 250px;
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
      border: 1px solid #E2E8F0;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      z-index: 9900;
      animation: fadeIn 0.15s ease-out;

      .popover-user-info {
        padding: 10px 12px;
        strong { font-size: 0.9rem; color: #0F172A; display: block; }
        .popover-email { font-size: 0.75rem; color: #64748B; display: block; overflow: hidden; text-overflow: ellipsis; }
        .popover-role-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          background: #E8F5E9;
          color: #1B4332;
          border-radius: 4px;
          margin-top: 4px;
        }
      }

      .popover-divider {
        height: 1px;
        background: #F1F5F9;
        margin: 4px 0;
      }

      .popover-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        font-size: 0.84rem;
        font-weight: 600;
        color: #334155;
        border-radius: 6px;
        text-decoration: none;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: #F1F5F9;
          color: #1B4332;
        }

        &.seller-highlight {
          color: #B45309;
          background: #FEF3C7;
          &:hover { background: #FDE68A; }
        }

        &.deliv-highlight {
          color: #15803D;
          background: #DCFCE7;
          &:hover { background: #BBF7D0; }
        }

        &.switch-btn {
          color: #2D6A4F;
          font-weight: 700;
        }

        &.logout-btn {
          color: #DC2626;
        }
      }
    }
  `],
})
export class CustomerLayoutComponent {
  auth = inject(AuthService);
  cartService = inject(CartService);
  router = inject(Router);

  searchQuery = '';
  showProfileMenu = signal<boolean>(false);
  showAuthModal = signal<boolean>(false);

  selectedAddressName(): string {
    return 'Sector 14, Gurugram';
  }

  openAddressModal() {
    this.router.navigate(['/addresses']);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }

  toggleProfileMenu() {
    this.showProfileMenu.set(!this.showProfileMenu());
  }

  openAuthModal() {
    this.showProfileMenu.set(false);
    this.showAuthModal.set(true);
  }

  logout() {
    this.showProfileMenu.set(false);
    this.auth.logout();
  }
}
