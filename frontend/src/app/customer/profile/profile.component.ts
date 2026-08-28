import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InrCurrencyPipe],
  template: `
    <div class="container profile-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Account / Profile</span>
          <h1>Customer Profile & Settings</h1>
          <p class="page-desc">Manage your personal information, loyalty points, and milk delivery preferences.</p>
        </div>
      </div>

      <div class="profile-grid" *ngIf="auth.currentUser as user">
        <!-- Profile Card -->
        <div class="profile-card card">
          <div class="avatar-header">
            <img [src]="user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'" alt="Avatar" class="profile-avatar" />
            <div>
              <h2>{{ user.name }}</h2>
              <span class="role-badge">{{ user.role }}</span>
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-box">
              <span class="stat-num">{{ (user.walletBalance || 0) | inrCurrency }}</span>
              <span class="stat-label">Milk Wallet</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">{{ user.customerProfile?.loyaltyPoints || 340 }}</span>
              <span class="stat-label">Dairy Points</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">{{ user.customerProfile?.orderCount || 18 }}</span>
              <span class="stat-label">Total Orders</span>
            </div>
          </div>

          <!-- Form Info -->
          <div class="profile-form">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="name" class="form-control" />
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [value]="user.email" disabled class="form-control disabled" />
            </div>

            <div class="form-group">
              <label>Mobile Number</label>
              <input type="text" [(ngModel)]="phone" class="form-control" />
            </div>

            <button class="btn btn-primary" (click)="saveProfile()">
              Save Changes
            </button>
          </div>
        </div>

        <!-- Quick Links Card -->
        <div class="links-card card">
          <h3>Account Navigation</h3>
          <div class="menu-list">
            <a routerLink="/subscriptions" class="menu-item">
              <span>🥛 My Daily Milk Subscriptions</span>
              <span>→</span>
            </a>
            <a routerLink="/orders" class="menu-item">
              <span>📦 My Orders & Live Tracking</span>
              <span>→</span>
            </a>
            <a routerLink="/addresses" class="menu-item">
              <span>📍 Saved Delivery Addresses</span>
              <span>→</span>
            </a>
            <a routerLink="/payments" class="menu-item">
              <span>💰 Milk Wallet & Top-up</span>
              <span>→</span>
            </a>
            <a routerLink="/notifications" class="menu-item">
              <span>🔔 Notification Preferences</span>
              <span>→</span>
            </a>
            <a routerLink="/seller/dashboard" class="menu-item admin-link" *ngIf="auth.isSeller">
              <span>👑 Open Seller / Dairy Operations Hub</span>
              <span>→</span>
            </a>
          </div>

          <div class="logout-box">
            <button class="btn btn-danger btn-block" (click)="auth.logout()">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { padding: 32px 20px 60px; }
    .page-head {
      margin-bottom: 28px;
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 2rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 32px;
      align-items: flex-start;
    }

    .profile-card, .links-card { padding: 28px; }

    .avatar-header {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 24px;

      .profile-avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--primary);
      }

      h2 { font-size: 1.4rem; margin-bottom: 2px; }

      .role-badge {
        font-size: 0.72rem;
        font-weight: 800;
        background-color: var(--primary-subtle);
        color: var(--primary);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
      }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background-color: var(--bg-app);
      padding: 16px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
      text-align: center;

      .stat-num {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--primary);
        display: block;
      }

      .stat-label {
        font-size: 0.72rem;
        color: var(--text-muted);
        font-weight: 600;
      }
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-control.disabled {
      background-color: var(--bg-app);
      color: var(--text-muted);
      cursor: not-allowed;
    }

    .links-card {
      h3 { font-size: 1.15rem; margin-bottom: 18px; }
    }

    .menu-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background-color: var(--bg-app);
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-main);
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--primary-subtle);
        color: var(--primary);
        transform: translateX(3px);
      }

      &.admin-link {
        background-color: var(--cream-surface);
        color: var(--butter-dark);
      }
    }

    .logout-box {
      border-top: 1px solid var(--border-subtle);
      padding-top: 18px;
    }

    @media (max-width: 900px) {
      .profile-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ProfileComponent {
  auth = inject(AuthService);
  api = inject(ApiService);
  toast = inject(ToastService);

  name = this.auth.currentUser?.name || '';
  phone = this.auth.currentUser?.phone || '';

  saveProfile() {
    this.api.put('users/profile', { name: this.name, phone: this.phone }).subscribe({
      next: (res) => {
        this.toast.success('Profile updated successfully!');
        this.auth.fetchProfile().subscribe();
      },
    });
  }
}
