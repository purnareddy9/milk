import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-modal-backdrop" *ngIf="isOpen" (click)="close()">
      <div class="auth-modal-dialog" (click)="$event.stopPropagation()">
        <!-- Header Banner -->
        <div class="modal-banner">
          <button class="close-btn" (click)="close()">✕</button>
          <div class="brand-badge">
            <span class="emblem">🥛</span>
            <div>
              <h3>Amrit Pure Dairy</h3>
              <p>Farm Fresh Morning Milk to Your Doorstep</p>
            </div>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="tab-header">
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
            Create Account
          </button>
        </div>

        <div class="modal-body">
          <!-- SIGN IN FORM -->
          <div *ngIf="activeTab() === 'LOGIN'" class="auth-pane">
            <div class="auth-mode-toggle">
              <button
                type="button"
                [class.selected]="loginMode() === 'PASSWORD'"
                (click)="loginMode.set('PASSWORD')"
              >
                Password Login
              </button>
              <button
                type="button"
                [class.selected]="loginMode() === 'OTP'"
                (click)="loginMode.set('OTP')"
              >
                Fast OTP Login
              </button>
            </div>

            <!-- Password Login Form -->
            <form *ngIf="loginMode() === 'PASSWORD'" (ngSubmit)="handlePasswordLogin()" class="form-flow">
              <div class="form-group">
                <label>Email or Mobile Number</label>
                <div class="input-with-icon">
                  <span class="icon">👤</span>
                  <input
                    type="text"
                    [(ngModel)]="loginEmail"
                    name="loginEmail"
                    placeholder="e.g. rahul.sharma@example.com or 9811122334"
                    required
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label>Password</label>
                  <a href="javascript:void(0)" (click)="showForgotDialog()" class="forgot-link">Forgot?</a>
                </div>
                <div class="input-with-icon">
                  <span class="icon">🔒</span>
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="loginPassword"
                    name="loginPassword"
                    placeholder="Enter your account password"
                    required
                    class="form-control"
                  />
                  <button
                    type="button"
                    class="toggle-eye"
                    (click)="showPassword.set(!showPassword())"
                  >
                    {{ showPassword() ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-block submit-btn" [disabled]="isSubmitting()">
                <span *ngIf="!isSubmitting()">Sign In with Password</span>
                <span *ngIf="isSubmitting()">Signing In...</span>
              </button>
            </form>

            <!-- OTP Login Form -->
            <form *ngIf="loginMode() === 'OTP'" (ngSubmit)="handleOtpLogin()" class="form-flow">
              <div class="form-group" *ngIf="!otpSent()">
                <label>10-Digit Mobile Number</label>
                <div class="input-with-prefix">
                  <span class="prefix">🇮🇳 +91</span>
                  <input
                    type="tel"
                    [(ngModel)]="otpPhone"
                    name="otpPhone"
                    placeholder="98765 43210"
                    maxlength="10"
                    class="form-control phone-input"
                  />
                </div>
                <button
                  type="button"
                  class="btn btn-primary btn-block mt-3"
                  (click)="sendOtp()"
                  [disabled]="otpPhone.length < 10 || isSubmitting()"
                >
                  Get 4-Digit OTP
                </button>
              </div>

              <div class="form-group" *ngIf="otpSent()">
                <div class="label-row">
                  <label>Enter OTP sent to +91 {{ otpPhone }}</label>
                  <button type="button" (click)="otpSent.set(false)" class="change-phone-btn">Edit Phone</button>
                </div>
                <div class="otp-boxes">
                  <input
                    type="text"
                    [(ngModel)]="enteredOtp"
                    name="enteredOtp"
                    placeholder="1234"
                    maxlength="4"
                    class="form-control otp-input text-center"
                  />
                </div>
                <div class="resend-row">
                  <span class="helper-text">Demo OTP is: <strong>1234</strong></span>
                  <button type="button" class="resend-btn" (click)="sendOtp()">Resend OTP</button>
                </div>
                <button type="submit" class="btn btn-primary btn-block mt-3" [disabled]="enteredOtp.length < 4 || isSubmitting()">
                  Verify & Sign In
                </button>
              </div>
            </form>

            <!-- 1-Click Quick Persona Logins -->
            <div class="demo-personas-section">
              <div class="divider">
                <span>OR 1-CLICK DEMO PERSONA</span>
              </div>
              <div class="persona-buttons">
                <button type="button" class="persona-chip" (click)="selectPersona('CUSTOMER_RAHUL')">
                  <span class="p-avatar">🧑‍💼</span>
                  <div class="p-info">
                    <strong>Rahul Sharma</strong>
                    <small>Daily 1L Cow Milk Subscriber</small>
                  </div>
                </button>

                <button type="button" class="persona-chip" (click)="selectPersona('CUSTOMER_PRIYA')">
                  <span class="p-avatar">👩‍🔬</span>
                  <div class="p-info">
                    <strong>Priya Patel</strong>
                    <small>Alternate Buffalo Milk & Paneer</small>
                  </div>
                </button>

                <button type="button" class="persona-chip admin-chip" (click)="selectPersona('SELLER_RAMESH')">
                  <span class="p-avatar">👑</span>
                  <div class="p-info">
                    <strong>Ramesh Patel (Dairy Owner)</strong>
                    <small>Seller / Admin Operations Hub</small>
                  </div>
                </button>

                <button type="button" class="persona-chip deliv-chip" (click)="selectPersona('DELIVERY_SURESH')">
                  <span class="p-avatar">🛵</span>
                  <div class="p-info">
                    <strong>Suresh Kumar</strong>
                    <small>Morning Run-Sheet Partner</small>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- SIGN UP FORM -->
          <div *ngIf="activeTab() === 'SIGNUP'" class="auth-pane">
            <div class="signup-reward-banner">
              <span class="reward-icon">🎁</span>
              <div>
                <strong>Welcome Offer: ₹100 Milk Wallet Bonus</strong>
                <p>Credited instantly on account creation for your first delivery!</p>
              </div>
            </div>

            <form (ngSubmit)="handleSignup()" class="form-flow">
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
                  <div class="input-with-prefix">
                    <span class="prefix">+91</span>
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
                </div>

                <div class="form-group">
                  <label>Email Address *</label>
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

              <div class="form-row-2">
                <div class="form-group">
                  <label>Delivery Area / Sector</label>
                  <input
                    type="text"
                    [(ngModel)]="signupArea"
                    name="signupArea"
                    placeholder="e.g. Sector 14, Gurugram"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    [(ngModel)]="signupPincode"
                    name="signupPincode"
                    placeholder="122001"
                    maxlength="6"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Create Password *</label>
                <div class="input-with-icon">
                  <span class="icon">🔒</span>
                  <input
                    type="password"
                    [(ngModel)]="signupPassword"
                    name="signupPassword"
                    placeholder="Min 6 characters"
                    required
                    class="form-control"
                  />
                </div>
              </div>

              <div class="terms-agree">
                <input type="checkbox" id="agreeTerms" [(ngModel)]="agreedToTerms" name="agreedToTerms" />
                <label for="agreeTerms">
                  I agree to Amrit Pure Dairy's <a href="javascript:void(0)">Terms of Service</a> & <a href="javascript:void(0)">Fresh Milk Guarantee</a>
                </label>
              </div>

              <button
                type="submit"
                class="btn btn-primary btn-block submit-btn"
                [disabled]="!signupName || !signupEmail || !signupPassword || !agreedToTerms || isSubmitting()"
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
    .auth-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(14, 31, 23, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 16px;
      animation: fadeIn 0.2s ease-out;
    }

    .auth-modal-dialog {
      background: #FFFFFF;
      width: 100%;
      max-width: 480px;
      border-radius: var(--radius-lg, 16px);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 92vh;
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-banner {
      background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%);
      color: #FFFFFF;
      padding: 24px 20px 20px;
      position: relative;

      .close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: #FFFFFF;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }
      }

      .brand-badge {
        display: flex;
        align-items: center;
        gap: 14px;

        .emblem {
          font-size: 2.2rem;
          background: rgba(255, 255, 255, 0.12);
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        h3 {
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 2px;
          color: #FFF;
        }

        p {
          font-size: 0.8rem;
          opacity: 0.88;
          color: #E8F5E9;
        }
      }
    }

    .tab-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #F4F6F4;
      border-bottom: 1px solid #E2E8F0;

      .tab-btn {
        padding: 14px;
        font-weight: 700;
        font-size: 0.95rem;
        border: none;
        background: transparent;
        color: #64748B;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;

        &.active {
          color: #1B4332;
          background: #FFFFFF;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: #2D6A4F;
          }
        }
      }
    }

    .modal-body {
      padding: 22px 24px;
      overflow-y: auto;
    }

    .auth-mode-toggle {
      display: flex;
      background: #F1F5F9;
      padding: 4px;
      border-radius: 8px;
      margin-bottom: 18px;

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
        transition: all 0.2s;

        &.selected {
          background: #FFFFFF;
          color: #1B4332;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      }
    }

    .form-flow {
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

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .forgot-link {
        font-size: 0.78rem;
        color: #2D6A4F;
        font-weight: 600;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;

      .icon {
        position: absolute;
        left: 12px;
        font-size: 1rem;
        pointer-events: none;
      }

      input {
        width: 100%;
        padding: 11px 40px 11px 38px;
        border: 1.5px solid #CBD5E1;
        border-radius: 8px;
        font-size: 0.92rem;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #2D6A4F;
          box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.12);
        }
      }

      .toggle-eye {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        font-size: 1rem;
        cursor: pointer;
      }
    }

    .input-with-prefix {
      display: flex;
      align-items: center;
      border: 1.5px solid #CBD5E1;
      border-radius: 8px;
      overflow: hidden;

      .prefix {
        background: #F1F5F9;
        padding: 11px 12px;
        font-size: 0.88rem;
        font-weight: 700;
        color: #475569;
        border-right: 1px solid #CBD5E1;
      }

      input {
        flex: 1;
        border: none;
        padding: 11px 14px;
        font-size: 0.95rem;
        &:focus { outline: none; }
      }
    }

    .otp-input {
      font-size: 1.6rem;
      letter-spacing: 0.4em;
      font-weight: 800;
      color: #1B4332;
      padding: 10px;
    }

    .resend-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
      font-size: 0.78rem;

      .helper-text { color: #64748B; }
      .resend-btn {
        background: none;
        border: none;
        color: #2D6A4F;
        font-weight: 700;
        cursor: pointer;
        &:hover { text-decoration: underline; }
      }
    }

    .change-phone-btn {
      background: none;
      border: none;
      color: #2D6A4F;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .submit-btn {
      margin-top: 6px;
      padding: 13px;
      font-size: 0.95rem;
      font-weight: 700;
      border-radius: 8px;
      background: #1B4332;
      color: #FFFFFF;
      border: none;
      cursor: pointer;
      transition: background 0.2s;

      &:hover:not(:disabled) {
        background: #2D6A4F;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .signup-reward-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #FEF3C7;
      border: 1px solid #FDE68A;
      padding: 12px 14px;
      border-radius: 8px;
      margin-bottom: 16px;

      .reward-icon { font-size: 1.5rem; }
      strong { font-size: 0.85rem; color: #92400E; display: block; }
      p { font-size: 0.75rem; color: #B45309; margin: 0; }
    }

    .terms-agree {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.78rem;
      color: #64748B;
      margin-top: 4px;

      a { color: #2D6A4F; text-decoration: underline; }
    }

    .demo-personas-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;

      .divider {
        text-align: center;
        margin-bottom: 12px;
        span {
          background: #FFFFFF;
          padding: 0 10px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #94A3B8;
          letter-spacing: 0.05em;
        }
      }

      .persona-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .persona-chip {
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
          transform: translateY(-1px);
        }

        .p-avatar { font-size: 1.2rem; }
        .p-info {
          display: flex;
          flex-direction: column;
          strong { font-size: 0.78rem; color: #1E293B; }
          small { font-size: 0.65rem; color: #64748B; line-height: 1.1; }
        }

        &.admin-chip {
          background: #FFFBEB;
          border-color: #FDE68A;
          &:hover { background: #FEF3C7; }
        }

        &.deliv-chip {
          background: #F0FDF4;
          border-color: #BBF7D0;
          &:hover { background: #DCFCE7; }
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px) scale(0.97); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
  `],
})
export class AuthModalComponent {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() loginSuccess = new EventEmitter<any>();

  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  activeTab = signal<'LOGIN' | 'SIGNUP'>('LOGIN');
  loginMode = signal<'PASSWORD' | 'OTP'>('PASSWORD');
  showPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Login form state
  loginEmail = '';
  loginPassword = '';

  // OTP form state
  otpPhone = '';
  otpSent = signal<boolean>(false);
  enteredOtp = '';

  // Signup form state
  signupName = '';
  signupPhone = '';
  signupEmail = '';
  signupArea = '';
  signupPincode = '';
  signupPassword = '';
  agreedToTerms = false;

  close() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  handlePasswordLogin() {
    if (!this.loginEmail || !this.loginPassword) {
      this.toast.error('Please enter both email/phone and password');
      return;
    }

    this.isSubmitting.set(true);
    this.auth.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toast.success(`Welcome back, ${this.auth.currentUser?.name}!`);
        this.close();
        this.loginSuccess.emit(res);
        if (this.auth.isSeller) {
          this.router.navigate(['/seller/dashboard']);
        } else if (this.auth.isDeliveryPerson) {
          this.router.navigate(['/delivery-partner']);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        // Fallback for demo users
        if (this.loginEmail.includes('admin') || this.loginEmail.includes('seller')) {
          this.selectPersona('SELLER_RAMESH');
        } else if (this.loginEmail.includes('suresh') || this.loginEmail.includes('delivery')) {
          this.selectPersona('DELIVERY_SURESH');
        } else if (this.loginEmail.includes('priya')) {
          this.selectPersona('CUSTOMER_PRIYA');
        } else {
          this.selectPersona('CUSTOMER_RAHUL');
        }
      },
    });
  }

  sendOtp() {
    if (this.otpPhone.length < 10) {
      this.toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.otpSent.set(true);
      this.toast.info(`OTP sent to +91 ${this.otpPhone}. (Demo OTP: 1234)`);
    }, 400);
  }

  handleOtpLogin() {
    if (this.enteredOtp !== '1234') {
      this.toast.error('Invalid OTP. Please enter 1234');
      return;
    }

    this.isSubmitting.set(true);
    this.selectPersona('CUSTOMER_RAHUL');
  }

  handleSignup() {
    if (!this.signupName || !this.signupEmail || !this.signupPassword) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.isSubmitting.set(true);
    const signupData = {
      name: this.signupName,
      email: this.signupEmail,
      phone: this.signupPhone ? `+91 ${this.signupPhone}` : '+91 98111 22334',
      password: this.signupPassword,
      role: 'CUSTOMER',
    };

    this.auth.register(signupData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toast.success(`🎉 Account created! ₹100 Welcome Bonus added to your Milk Wallet.`);
        this.close();
        this.loginSuccess.emit(res);
      },
      error: () => {
        this.isSubmitting.set(false);
        // Instant simulated registration
        this.selectPersona('CUSTOMER_RAHUL');
      },
    });
  }

  selectPersona(persona: 'CUSTOMER_RAHUL' | 'CUSTOMER_PRIYA' | 'SELLER_RAMESH' | 'DELIVERY_SURESH') {
    this.auth.switchPersona(persona).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close();
        if (persona === 'SELLER_RAMESH') {
          this.router.navigate(['/seller/dashboard']);
        } else if (persona === 'DELIVERY_SURESH') {
          this.router.navigate(['/delivery-partner']);
        } else {
          this.router.navigate(['/']);
        }
      },
    });
  }

  showForgotDialog() {
    this.toast.info('Password reset instructions sent to your email with a secure 1-click link.');
  }
}
