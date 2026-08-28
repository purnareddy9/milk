import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-persona-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="persona-pill" *ngIf="isVisible()" [class.expanded]="isExpanded()">
      <!-- Main Trigger -->
      <button class="pill-trigger" (click)="toggleExpand()">
        <span class="avatar-ring">
          <img [src]="currentAvatar()" [alt]="currentName()" class="avatar-img" />
        </span>
        <div class="user-meta" *ngIf="!isExpanded()">
          <span class="user-name">{{ currentName() }}</span>
          <span class="user-role-badge">{{ currentRoleLabel() }}</span>
        </div>
        <span class="chevron-icon">{{ isExpanded() ? '▲' : '▼' }}</span>
      </button>

      <!-- Dropdown Persona Options -->
      <div class="persona-menu" *ngIf="isExpanded()">
        <div class="menu-header">
          <span class="menu-title">⚡ Instant Role Switcher</span>
          <span class="menu-sub">Switch personas for end-to-end testing</span>
        </div>

        <div class="personas-list">
          <button
            class="persona-option"
            [class.active]="currentRole() === 'CUSTOMER' && currentEmail().includes('rahul')"
            (click)="selectPersona('CUSTOMER_RAHUL')"
          >
            <span class="opt-avatar">👤</span>
            <div class="opt-info">
              <span class="opt-name">Rahul Sharma</span>
              <span class="opt-desc">Customer (Daily 1L Cow Milk Sub)</span>
            </div>
            <span class="opt-badge">Customer</span>
          </button>

          <button
            class="persona-option"
            [class.active]="currentRole() === 'CUSTOMER' && currentEmail().includes('priya')"
            (click)="selectPersona('CUSTOMER_PRIYA')"
          >
            <span class="opt-avatar">👩</span>
            <div class="opt-info">
              <span class="opt-name">Priya Patel</span>
              <span class="opt-desc">Customer (Alternate Buffalo Milk & Paneer)</span>
            </div>
            <span class="opt-badge">Customer</span>
          </button>

          <button
            class="persona-option"
            [class.active]="currentRole() === 'SELLER' || currentRole() === 'ADMIN'"
            (click)="selectPersona('SELLER_RAMESH')"
          >
            <span class="opt-avatar">👑</span>
            <div class="opt-info">
              <span class="opt-name">Ramesh Patel (Dairy Owner)</span>
              <span class="opt-desc">Seller Admin (Operations, Milk Req, Dispatch)</span>
            </div>
            <span class="opt-badge gold">Seller</span>
          </button>

          <button
            class="persona-option"
            [class.active]="currentRole() === 'DELIVERY_PERSON'"
            (click)="selectPersona('DELIVERY_SURESH')"
          >
            <span class="opt-avatar">🛵</span>
            <div class="opt-info">
              <span class="opt-name">Suresh Kumar</span>
              <span class="opt-desc">Delivery Partner (Morning Run-Sheet)</span>
            </div>
            <span class="opt-badge blue">Driver</span>
          </button>
        </div>

        <!-- Quick navigation shortcuts -->
        <div class="menu-footer">
          <button class="nav-btn" (click)="navigateTo('/')">Storefront</button>
          <button class="nav-btn seller" *ngIf="auth.isSeller" (click)="navigateTo('/seller/dashboard')">Admin Hub</button>
          <button class="nav-btn driver" *ngIf="auth.isDeliveryPerson" (click)="navigateTo('/delivery-partner')">Driver Sheet</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .persona-pill {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 9000;
      background: #ffffff;
      border-radius: var(--radius-full);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
      border: 1.5px solid var(--border-subtle);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

      &.expanded {
        border-radius: var(--radius-lg);
        width: 340px;
        box-shadow: 0 16px 40px rgba(27, 67, 50, 0.22);
      }

      @media (max-width: 768px) {
        bottom: 74px;
        left: 12px;
        &.expanded {
          width: calc(100vw - 24px);
        }
      }
    }

    .pill-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 14px 6px 6px;
      border-radius: var(--radius-full);
      width: 100%;
      background: none;
    }

    .avatar-ring {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid var(--primary);
      flex-shrink: 0;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .user-name {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text-main);
      white-space: nowrap;
    }

    .user-role-badge {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--primary);
    }

    .chevron-icon {
      font-size: 0.65rem;
      color: var(--text-muted);
      margin-left: 4px;
    }

    .persona-menu {
      padding: 14px;
      border-top: 1px solid var(--border-subtle);
    }

    .menu-header {
      margin-bottom: 10px;
    }

    .menu-title {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-main);
      display: block;
    }

    .menu-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .personas-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .persona-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-md);
      background-color: var(--bg-app);
      border: 1px solid transparent;
      transition: all 0.2s ease;
      width: 100%;
      text-align: left;

      &:hover {
        background-color: var(--primary-subtle);
      }

      &.active {
        background-color: var(--primary-subtle);
        border-color: var(--primary);
      }
    }

    .opt-avatar {
      font-size: 1.25rem;
    }

    .opt-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .opt-name {
      font-weight: 700;
      font-size: 0.825rem;
      color: var(--text-main);
    }

    .opt-desc {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .opt-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background-color: var(--border-subtle);
      color: var(--text-body);

      &.gold {
        background-color: var(--gold-badge);
        color: var(--butter-dark);
      }

      &.blue {
        background-color: var(--sky-subtle);
        color: var(--sky-blue);
      }
    }

    .menu-footer {
      display: flex;
      gap: 6px;
      border-top: 1px solid var(--border-subtle);
      padding-top: 10px;
    }

    .nav-btn {
      flex: 1;
      padding: 6px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      background-color: var(--primary-subtle);
      color: var(--primary);
      text-align: center;

      &.seller {
        background-color: var(--cream-surface);
        color: var(--butter-dark);
      }

      &.driver {
        background-color: var(--sky-subtle);
        color: var(--sky-blue);
      }
    }
  `],
})
export class PersonaSwitcherComponent {
  auth = inject(AuthService);
  router = inject(Router);

  isExpanded = signal<boolean>(false);

  toggleExpand() {
    this.isExpanded.set(!this.isExpanded());
  }

  isVisible(): boolean {
    if (typeof window === 'undefined') return false;
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isDev || localStorage.getItem('show_demo_switcher') === 'true';
  }

  currentName(): string {
    return this.auth.currentUser?.name || 'Rahul Sharma';
  }

  currentRole(): string {
    return this.auth.currentUser?.role || 'CUSTOMER';
  }

  currentEmail(): string {
    return this.auth.currentUser?.email || '';
  }

  currentAvatar(): string {
    return this.auth.currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  }

  currentRoleLabel(): string {
    const role = this.currentRole();
    if (role === 'SELLER' || role === 'ADMIN') return 'Dairy Owner (Admin)';
    if (role === 'DELIVERY_PERSON') return 'Delivery Partner';
    return 'Customer';
  }

  selectPersona(persona: 'CUSTOMER_RAHUL' | 'CUSTOMER_PRIYA' | 'SELLER_RAMESH' | 'DELIVERY_SURESH') {
    this.auth.switchPersona(persona).subscribe(() => {
      this.isExpanded.set(false);
      if (persona === 'SELLER_RAMESH') {
        this.router.navigate(['/seller/dashboard']);
      } else if (persona === 'DELIVERY_SURESH') {
        this.router.navigate(['/delivery-partner']);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  navigateTo(path: string) {
    this.isExpanded.set(false);
    this.router.navigate([path]);
  }
}
