import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PersonaSwitcherComponent } from '../../shared/components/persona-switcher/persona-switcher.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, PersonaSwitcherComponent, ToastContainerComponent],
  template: `
    <div class="seller-app-layout">
      <!-- Admin Sidebar -->
      <aside class="seller-sidebar" [class.collapsed]="isSidebarCollapsed()">
        <div class="sidebar-brand">
          <span class="logo-icon">🥛</span>
          <div class="brand-text" *ngIf="!isSidebarCollapsed()">
            <h2>AMRIT DAIRY</h2>
            <span class="brand-badge">OPERATIONS HUB</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/seller/dashboard" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📊</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Dashboard</span>
          </a>

          <!-- Daily Milk Requirement (Highlighted Section 16 Feature) -->
          <a routerLink="/seller/milk-requirement" routerLinkActive="active" class="nav-link milk-req-link">
            <span class="link-icon">🥛</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Daily Milk Demand</span>
            <span class="alert-dot" *ngIf="!isSidebarCollapsed()">Required</span>
          </a>

          <a routerLink="/seller/orders" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📦</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Orders</span>
          </a>

          <a routerLink="/seller/subscriptions" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📅</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Subscriptions</span>
          </a>

          <a routerLink="/seller/delivery" routerLinkActive="active" class="nav-link">
            <span class="link-icon">🚚</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Delivery Routes</span>
          </a>

          <a routerLink="/seller/inventory" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📋</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Inventory & Stock</span>
          </a>

          <a routerLink="/seller/products" routerLinkActive="active" class="nav-link">
            <span class="link-icon">🏷️</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Products & Prices</span>
          </a>

          <a routerLink="/seller/customers" routerLinkActive="active" class="nav-link">
            <span class="link-icon">👥</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Customers CRM</span>
          </a>

          <a routerLink="/seller/analytics" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📈</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Analytics & MRR</span>
          </a>

          <a routerLink="/seller/coupons" routerLinkActive="active" class="nav-link">
            <span class="link-icon">🎟️</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Coupons & Offers</span>
          </a>

          <a routerLink="/seller/settings" routerLinkActive="active" class="nav-link">
            <span class="link-icon">⚙️</span>
            <span class="link-text" *ngIf="!isSidebarCollapsed()">Dairy Settings</span>
          </a>
        </nav>

        <div class="sidebar-foot" *ngIf="!isSidebarCollapsed()">
          <a routerLink="/" class="storefront-link">
            <span>← Customer Storefront</span>
          </a>
        </div>
      </aside>

      <!-- Main Admin Content Area -->
      <div class="seller-main-wrapper">
        <!-- Admin Top Navigation Bar -->
        <header class="seller-top-bar">
          <div class="top-bar-left">
            <button class="toggle-btn" (click)="toggleSidebar()">☰</button>
            <div class="morning-status-pill">
              <span class="pulse-dot"></span>
              <span>Morning Dispatch Window: <strong>5:30 AM – 7:30 AM</strong></span>
            </div>
          </div>

          <div class="top-bar-right">
            <a routerLink="/seller/milk-requirement" class="btn btn-gold btn-sm">
              🥛 View Today's Milk Liters
            </a>
            <a routerLink="/" class="btn btn-light btn-sm">
              🛒 Storefront
            </a>
          </div>
        </header>

        <!-- Dynamic Admin Content -->
        <main class="seller-page-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Demo Persona Switcher -->
      <app-persona-switcher></app-persona-switcher>

      <!-- Toasts -->
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .seller-app-layout {
      display: flex;
      min-height: 100vh;
      background-color: #f4f7f5;
    }

    .seller-sidebar {
      width: 260px;
      background-color: #142e22;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width 0.25s ease;
      z-index: 1000;

      &.collapsed {
        width: 70px;
      }
    }

    .sidebar-brand {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .logo-icon { font-size: 1.8rem; }
      h2 { font-size: 1.15rem; color: #ffffff; letter-spacing: 0.04em; }
      .brand-badge { font-size: 0.65rem; color: var(--butter-gold); font-weight: 800; letter-spacing: 0.08em; }
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }

      &.active {
        background-color: var(--primary-accent);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      }

      &.milk-req-link {
        background-color: rgba(221, 161, 94, 0.15);
        color: var(--butter-gold);
        border: 1px solid rgba(221, 161, 94, 0.3);

        &.active {
          background-color: var(--butter-dark);
          color: #ffffff;
        }
      }

      .link-icon { font-size: 1.1rem; }
      .link-text { flex: 1; }

      .alert-dot {
        font-size: 0.65rem;
        background-color: var(--butter-gold);
        color: #142e22;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
      }
    }

    .sidebar-foot {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      .storefront-link {
        color: var(--primary-subtle);
        font-size: 0.85rem;
        font-weight: 700;
        &:hover { text-decoration: underline; }
      }
    }

    .seller-main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .seller-top-bar {
      height: 64px;
      background-color: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 900;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .toggle-btn {
        font-size: 1.25rem;
        color: var(--text-muted);
        padding: 6px;
      }

      .morning-status-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: var(--bg-app);
        padding: 6px 14px;
        border-radius: var(--radius-full);
        font-size: 0.825rem;
        color: var(--text-body);
        border: 1px solid var(--border-subtle);

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--success);
          box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.2);
        }
      }
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .seller-page-content {
      padding: 28px;
      flex: 1;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .seller-sidebar {
        position: fixed;
        left: -260px;
        height: 100vh;
        &.collapsed {
          left: 0;
          width: 260px;
        }
      }
      .morning-status-pill { display: none; }
    }
  `],
})
export class SellerLayoutComponent {
  auth = inject(AuthService);
  isSidebarCollapsed = signal<boolean>(false);

  toggleSidebar() {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }
}
