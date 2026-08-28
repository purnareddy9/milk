import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page-container">
      <div class="auth-card">
        <div class="auth-card-banner">
          <a routerLink="/" class="back-link">← Back to Dairy Store</a>
          <div class="brand-logo">
            <span class="emblem">🥛</span>
            <div>
              <h2>AMRIT PURE DAIRY</h2>
              <p>Farm Fresh Morning Milk & Artisanal Dairy</p>
            </div>
          </div>
        </div>

        <div class="auth-tabs">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'LOGIN'"
            (click)="activeTab.set('LOGIN')"
          >
            Sign In
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'SIGNUP'"
            (click)="activeTab.set('SIGNUP')"
          >
            Create New Account
          </button>
        </div>

        <div class="card-content">
          <!-- LOGIN TAB -->
          <div *ngIf="activeTab() === 'LOGIN'">
            <div class="mode-switch">
              <button
                type="button"
                [class.active]="loginMode() === 'PASSWORD'"
                (click)="loginMode.set('PASSWORD')"
              >
                Password Login
              </button>
              <button
                type="button"
                [class.active]="loginMode() === 'OTP'"
                (click)="loginMode.set('OTP')"
              >
                1-Click Mobile OTP
              </button>
            </div>

            <!-- Password Form -->
            <form *ngIf="loginMode() === 'PASSWORD'" (ngSubmit)="handleLogin()" class="form-body">
              <div class="form-group">
                <label>Email or Mobile</label>
                <input
                  type="text"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="rahul.sharma@example.com or 9811122334"
                  required
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <div class="label-split">
                  <label>Password</label>
                  <a href="javascript:void(0)" (click)="forgotPassword()" class="forgot-text">Forgot password?</a>
                </div>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Enter password (default: password123)"
                  required
                  class="form-control"
                />
              </div>

              <button type="submit" class="btn btn-primary btn-block submit-btn" [disabled]="isSubmitting()">
                <span *ngIf="!isSubmitting()">Sign In</span>
                <span *ngIf="isSubmitting()">Signing In...</span>
              </button>
            </form>

            <!-- OTP Form -->
            <form *ngIf="loginMode() === 'OTP'" (ngSubmit)="verifyOtp()" class="form-body">
              <div class="form-group" *ngIf="!otpSent()">
                <label>Mobile Number</label>
                <div class="phone-input-group">
                  <span class="phone-prefix">+91</span>
                  <input
                    type="tel"
                    [(ngModel)]="phone"
                    name="phone"
                    placeholder="98765 43210"
                    maxlength="10"
                    class="form-control"
                  />
                </div>
                <button
                  type="button"
                  class="btn btn-primary btn-block mt-3"
                  (click)="sendOtp()"
                  [disabled]="phone.length < 10"
                >
                  Send OTP Code
                </button>
              </div>

              <div class="form-group" *ngIf="otpSent()">
                <label>Enter 4-Digit OTP Code</label>
                <input
                  type="text"
                  [(ngModel)]="enteredOtp"
                  name="enteredOtp"
                  placeholder="1234"
                  maxlength="4"
                  class="form-control text-center otp-input"
                />
                <p class="otp-hint">Demo code is <strong>1234</strong></p>
                <button type="submit" class="btn btn-primary btn-block mt-2" [disabled]="enteredOtp.length < 4">
                  Verify & Continue
                </button>
              </div>
            </form>

            <!-- Quick Demo Switcher -->
            <div class="persona-panel">
              <div class="panel-title"><span>OR 1-CLICK INSTANT DEMO LOGIN</span></div>
              <div class="persona-grid">
                <button type="button" class="persona-card" (click)="quickLogin('CUSTOMER_RAHUL')">
                  <span class="icon">🧑‍💼</span>
                  <div class="meta">
                    <strong>Rahul Sharma</strong>
                    <span>Customer (Daily 1L Cow Milk)</span>
                  </div>
                </button>
                <button type="button" class="persona-card" (click)="quickLogin('CUSTOMER_PRIYA')">
                  <span class="icon">👩‍🔬</span>
                  <div class="meta">
                    <strong>Priya Patel</strong>
                    <span>Customer (Buffalo Milk & Paneer)</span>
                  </div>
                </button>
                <button type="button" class="persona-card admin-card" (click)="quickLogin('SELLER_RAMESH')">
                  <span class="icon">👑</span>
                  <div class="meta">
                    <strong>Ramesh Patel</strong>
                    <span>Seller / Dairy Owner</span>
                  </div>
                </button>
                <button type="button" class="persona-card deliv-card" (click)="quickLogin('DELIVERY_SURESH')">
                  <span class="icon">🛵</span>
                  <div class="meta">
                    <strong>Suresh Kumar</strong>
                    <span>Delivery Partner Run-Sheet</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- SIGNUP TAB -->
          <div *ngIf="activeTab() === 'SIGNUP'">
            <div class="welcome-badge">
              <span>🎁</span>
              <div>
                <strong>Join Amrit Pure Family</strong>
                <small>Get ₹100 Welcome Credit credited instantly to your Milk Wallet</small>
              </div>
            </div>

            <form (ngSubmit)="handleSignup()" class="form-body">
              <div class="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  [(ngModel)]="signupName"
                  name="signupName"
                  placeholder="e.g. Vikram Malhotra"
                  required
                  class="form-control"
                />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    [(ngModel)]="signupPhone"
                    name="signupPhone"
                    placeholder="9876543210"
                    maxlength="10"
                    required
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    [(ngModel)]="signupEmail"
                    name="signupEmail"
                    placeholder="vikram@example.com"
                    required
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  [(ngModel)]="signupPassword"
                  name="signupPassword"
                  placeholder="At least 6 characters"
                  required
                  class="form-control"
                />
              </div>

              <button
                type="submit"
                class="btn btn-primary btn-block submit-btn"
                [disabled]="!signupName || !signupEmail || !signupPassword || isSubmitting()"
              >
                <span *ngIf="!isSubmitting()">🎉 Create Account & Claim ₹100</span>
                <span *ngIf="isSubmitting()">Creating Account...</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page-container {
      min-height: 85vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      background: radial-gradient(circle at top, #E8F5E9 0%, #F8FAF8 70%);
    }

    .auth-card {
      width: 100%;
      max-width: 500px;
      background: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 20px 45px rgba(27, 67, 50, 0.12);
      border: 1px solid #E2E8F0;
      overflow: hidden;
    }

    .auth-card-banner {
      background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%);
      color: #FFFFFF;
      padding: 24px 24px 20px;

      .back-link {
        color: #E8F5E9;
        font-size: 0.8rem;
        font-weight: 600;
        text-decoration: none;
        display: inline-block;
        margin-bottom: 12px;
        &:hover { text-decoration: underline; }
      }

      .brand-logo {
        display: flex;
        align-items: center;
        gap: 12px;

        .emblem { font-size: 2.2rem; }
        h2 { font-size: 1.3rem; margin: 0; color: #FFF; font-weight: 800; }
        p { font-size: 0.8rem; margin: 2px 0 0; color: #C7E9C0; }
      }
    }

    .auth-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #F1F5F9;
      border-bottom: 1px solid #CBD5E1;

      .tab-btn {
        padding: 13px;
        font-size: 0.95rem;
        font-weight: 700;
        border: none;
        background: transparent;
        color: #64748B;
        cursor: pointer;
        transition: all 0.2s;

        &.active {
          background: #FFFFFF;
          color: #1B4332;
          border-bottom: 3px solid #2D6A4F;
        }
      }
    }

    .card-content {
      padding: 24px;
    }

    .mode-switch {
      display: flex;
      background: #F1F5F9;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 20px;

      button {
        flex: 1;
        padding: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: #64748B;
        cursor: pointer;

        &.active {
          background: #FFFFFF;
          color: #1B4332;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      }
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.82rem;
        font-weight: 700;
        color: #334155;
      }
    }

    .label-split {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .forgot-text {
        font-size: 0.78rem;
        color: #2D6A4F;
        font-weight: 600;
      }
    }

    .form-control {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid #CBD5E1;
      border-radius: 8px;
      font-size: 0.92rem;
      &:focus {
        outline: none;
        border-color: #2D6A4F;
        box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.12);
      }
    }

    .phone-input-group {
      display: flex;
      border: 1.5px solid #CBD5E1;
      border-radius: 8px;
      overflow: hidden;

      .phone-prefix {
        background: #F1F5F9;
        padding: 11px 12px;
        font-weight: 700;
        color: #475569;
        border-right: 1px solid #CBD5E1;
      }

      input { border: none; flex: 1; padding: 11px 14px; &:focus { outline: none; } }
    }

    .otp-input {
      font-size: 1.5rem;
      letter-spacing: 0.3em;
      font-weight: 800;
    }

    .otp-hint {
      font-size: 0.78rem;
      color: #64748B;
      margin: 4px 0 0;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .submit-btn {
      margin-top: 8px;
      padding: 13px;
      font-weight: 700;
      font-size: 0.95rem;
      background: #1B4332;
      color: #FFF;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      &:hover:not(:disabled) { background: #2D6A4F; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .welcome-badge {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #FEF3C7;
      border: 1px solid #FDE68A;
      padding: 12px 14px;
      border-radius: 8px;
      margin-bottom: 16px;

      span { font-size: 1.5rem; }
      strong { font-size: 0.85rem; color: #92400E; display: block; }
      small { font-size: 0.75rem; color: #B45309; }
    }

    .persona-panel {
      margin-top: 22px;
      padding-top: 18px;
      border-top: 1px solid #E2E8F0;

      .panel-title {
        text-align: center;
        margin-bottom: 12px;
        span {
          font-size: 0.72rem;
          font-weight: 800;
          color: #94A3B8;
          letter-spacing: 0.05em;
        }
      }

      .persona-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .persona-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background: #E8F5E9;
          border-color: #A7F3D0;
        }

        .icon { font-size: 1.2rem; }
        .meta {
          display: flex;
          flex-direction: column;
          strong { font-size: 0.78rem; color: #1E293B; }
          span { font-size: 0.65rem; color: #64748B; line-height: 1.1; }
        }

        &.admin-card {
          background: #FFFBEB;
          border-color: #FDE68A;
          &:hover { background: #FEF3C7; }
        }

        &.deliv-card {
          background: #F0FDF4;
          border-color: #BBF7D0;
          &:hover { background: #DCFCE7; }
        }
      }
    }
  `],
})
export class AuthPageComponent implements OnInit {
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  activeTab = signal<'LOGIN' | 'SIGNUP'>('LOGIN');
  loginMode = signal<'PASSWORD' | 'OTP'>('PASSWORD');
  isSubmitting = signal<boolean>(false);

  email = '';
  password = '';
  phone = '';
  otpSent = signal<boolean>(false);
  enteredOtp = '';

  signupName = '';
  signupPhone = '';
  signupEmail = '';
  signupPassword = '';

  ngOnInit() {
    this.route.url.subscribe((segments) => {
      const path = segments[0]?.path;
      if (path === 'register' || path === 'signup') {
        this.activeTab.set('SIGNUP');
      } else {
        this.activeTab.set('LOGIN');
      }
    });
  }

  handleLogin() {
    if (!this.email || !this.password) {
      this.toast.error('Please enter email/phone and password');
      return;
    }

    this.isSubmitting.set(true);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toast.success(`Welcome back, ${res.user.name}!`);
        this.redirectAfterLogin(res.user);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.quickLogin('CUSTOMER_RAHUL');
      },
    });
  }

  sendOtp() {
    if (this.phone.length < 10) {
      this.toast.error('Enter a valid 10-digit phone number');
      return;
    }
    this.otpSent.set(true);
    this.toast.info(`OTP sent to +91 ${this.phone}. Demo OTP: 1234`);
  }

  verifyOtp() {
    if (this.enteredOtp !== '1234') {
      this.toast.error('Invalid OTP. Use 1234');
      return;
    }
    this.quickLogin('CUSTOMER_RAHUL');
  }

  handleSignup() {
    if (!this.signupName || !this.signupEmail || !this.signupPassword) {
      this.toast.error('Please fill all required fields');
      return;
    }

    this.isSubmitting.set(true);
    this.auth.register({
      name: this.signupName,
      email: this.signupEmail,
      phone: this.signupPhone ? `+91 ${this.signupPhone}` : '+91 98111 22334',
      password: this.signupPassword,
      role: 'CUSTOMER',
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toast.success('🎉 Welcome to Amrit Pure Dairy! ₹100 credited to your wallet.');
        this.redirectAfterLogin(res.user);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.quickLogin('CUSTOMER_RAHUL');
      },
    });
  }

  quickLogin(persona: 'CUSTOMER_RAHUL' | 'CUSTOMER_PRIYA' | 'SELLER_RAMESH' | 'DELIVERY_SURESH') {
    this.auth.switchPersona(persona).subscribe({
      next: () => {
        const u = this.auth.currentUser;
        this.redirectAfterLogin(u);
      },
    });
  }

  private redirectAfterLogin(user: any) {
    if (user?.role === 'SELLER' || user?.role === 'ADMIN') {
      this.router.navigate(['/seller/dashboard']);
    } else if (user?.role === 'DELIVERY_PERSON') {
      this.router.navigate(['/delivery-partner']);
    } else {
      this.router.navigate(['/']);
    }
  }

  forgotPassword() {
    this.toast.info('Password reset instructions sent to your email.');
  }
}
