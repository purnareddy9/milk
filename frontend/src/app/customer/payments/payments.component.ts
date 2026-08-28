import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { format, parseISO } from 'date-fns';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe],
  template: `
    <div class="container wallet-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Account / Payments</span>
          <h1>Milk Wallet & Payment Methods</h1>
          <p class="page-desc">
            Recharge your Milk Wallet for seamless, automatic daily subscription deductions without OTP friction.
          </p>
        </div>
      </div>

      <div class="wallet-grid">
        <!-- Left: Wallet Card & Recharge -->
        <div class="wallet-left">
          <div class="wallet-card card">
            <div class="wallet-top">
              <span class="wallet-label">🥛 Pure Milk Balance</span>
              <span class="auto-tag">✓ Auto-Debit Active</span>
            </div>

            <div class="balance-display">
              <span class="bal-currency">₹</span>
              <span class="bal-amount">{{ (walletBalance() || 0) | inrCurrency }}</span>
            </div>

            <p class="wallet-hint">
              Sufficient for approximately <strong>{{ Math.floor(walletBalance() / 58) }} days</strong> of 1L Cow Milk daily deliveries.
            </p>
          </div>

          <!-- Recharge Box -->
          <div class="recharge-box card">
            <h3>⚡ Instant Wallet Top-Up</h3>
            <p class="recharge-sub">Select a top-up amount or enter custom value below:</p>

            <div class="quick-amounts">
              <button
                class="amt-chip"
                [class.active]="rechargeAmount === 500"
                (click)="setAmount(500)"
              >
                ₹500
              </button>

              <button
                class="amt-chip"
                [class.active]="rechargeAmount === 1000"
                (click)="setAmount(1000)"
              >
                ₹1,000 <small class="bonus">+₹40</small>
              </button>

              <button
                class="amt-chip"
                [class.active]="rechargeAmount === 2000"
                (click)="setAmount(2000)"
              >
                ₹2,000 <small class="bonus">+₹100</small>
              </button>

              <button
                class="amt-chip"
                [class.active]="rechargeAmount === 3000"
                (click)="setAmount(3000)"
              >
                ₹3,000 <small class="bonus">+₹150</small>
              </button>
            </div>

            <div class="custom-amount-input form-group">
              <label>Custom Top-up Amount</label>
              <input
                type="number"
                [(ngModel)]="rechargeAmount"
                min="50"
                step="50"
                class="form-control"
              />
            </div>

            <button
              class="btn btn-gold btn-block btn-lg"
              [disabled]="isRecharging() || rechargeAmount < 50"
              (click)="rechargeWallet()"
            >
              {{ isRecharging() ? 'Recharging...' : '✨ Recharge ' + (rechargeAmount | inrCurrency) }}
            </button>
          </div>
        </div>

        <!-- Right: Transaction Ledger -->
        <div class="wallet-right">
          <div class="ledger-card card">
            <h3>📜 Wallet Transaction Ledger</h3>
            
            <div class="transactions-list" *ngIf="transactions().length > 0">
              <div *ngFor="let txn of transactions()" class="txn-row">
                <div class="txn-icon" [class.credit]="txn.type === 'CREDIT'" [class.debit]="txn.type === 'DEBIT'">
                  {{ txn.type === 'CREDIT' ? '↓' : '↑' }}
                </div>
                
                <div class="txn-details">
                  <strong>{{ txn.description }}</strong>
                  <span class="txn-date">{{ formatDate(txn.createdAt) }}</span>
                </div>

                <div class="txn-amt-box">
                  <span class="txn-amount" [class.credit]="txn.type === 'CREDIT'" [class.debit]="txn.type === 'DEBIT'">
                    {{ txn.type === 'CREDIT' ? '+' : '−' }}{{ txn.amount | inrCurrency }}
                  </span>
                  <span class="bal-after">Bal: {{ txn.balanceAfter | inrCurrency }}</span>
                </div>
              </div>
            </div>

            <div class="empty-txns" *ngIf="transactions().length === 0">
              <p>No wallet transactions recorded yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wallet-page { padding: 32px 20px 60px; }
    .page-head {
      margin-bottom: 28px;
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 2rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .wallet-grid {
      display: grid;
      grid-template-columns: 1.1fr 1.3fr;
      gap: 32px;
      align-items: flex-start;
    }

    .wallet-left {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .wallet-card {
      background: linear-gradient(135deg, var(--primary) 0%, #143527 100%);
      color: #ffffff;
      padding: 28px;

      .wallet-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;

        .wallet-label {
          font-size: 0.85rem;
          color: var(--primary-subtle);
          font-weight: 700;
          text-transform: uppercase;
        }

        .auto-tag {
          font-size: 0.72rem;
          background: rgba(255, 255, 255, 0.18);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }
      }

      .balance-display {
        display: flex;
        align-items: baseline;
        margin-bottom: 12px;

        .bal-currency {
          font-size: 1.6rem;
          margin-right: 4px;
        }

        .bal-amount {
          font-size: 2.6rem;
          font-weight: 800;
          line-height: 1;
        }
      }

      .wallet-hint {
        font-size: 0.85rem;
        color: var(--primary-subtle);
      }
    }

    .recharge-box {
      padding: 24px;

      h3 { font-size: 1.15rem; margin-bottom: 4px; }
      .recharge-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; }

      .quick-amounts {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }

      .amt-chip {
        padding: 10px 6px;
        border-radius: var(--radius-md);
        border: 1.5px solid var(--border-subtle);
        background: #ffffff;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        transition: all 0.2s ease;

        .bonus {
          font-size: 0.65rem;
          color: var(--success);
          font-weight: 800;
        }

        &:hover { border-color: var(--primary); }

        &.active {
          border-color: var(--primary);
          background-color: var(--primary-subtle);
          color: var(--primary);
        }
      }
    }

    .ledger-card {
      padding: 24px;

      h3 { font-size: 1.15rem; margin-bottom: 18px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; }
    }

    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .txn-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border-subtle);

      &:last-child { border-bottom: none; }

      .txn-icon {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.1rem;

        &.credit {
          background-color: var(--success-bg);
          color: var(--success);
        }

        &.debit {
          background-color: var(--danger-bg);
          color: var(--danger);
        }
      }

      .txn-details {
        flex: 1;
        display: flex;
        flex-direction: column;

        strong { font-size: 0.875rem; color: var(--text-main); }
        .txn-date { font-size: 0.75rem; color: var(--text-muted); }
      }

      .txn-amt-box {
        text-align: right;
        display: flex;
        flex-direction: column;

        .txn-amount {
          font-weight: 800;
          font-size: 0.95rem;

          &.credit { color: var(--success); }
          &.debit { color: var(--text-main); }
        }

        .bal-after {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      }
    }

    .empty-txns {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
    }

    @media (max-width: 900px) {
      .wallet-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class PaymentsComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);

  walletBalance = signal<number>(1450);
  transactions = signal<any[]>([]);

  rechargeAmount = 1000;
  isRecharging = signal<boolean>(false);
  Math = Math;

  ngOnInit() {
    this.loadWallet();
  }

  loadWallet() {
    this.api.get<{ balance: number; transactions: any[] }>('payments/wallet').subscribe({
      next: (res) => {
        if (res) {
          this.walletBalance.set(Number(res.balance || 0));
          this.transactions.set(res.transactions || []);
        }
      },
    });
  }

  setAmount(amt: number) {
    this.rechargeAmount = amt;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm a');
  }

  rechargeWallet() {
    this.isRecharging.set(true);
    this.api.post<{ newBalance: number; message: string }>('payments/wallet/recharge', {
      amount: this.rechargeAmount,
      paymentMethod: 'UPI',
    }).subscribe({
      next: (res) => {
        this.isRecharging.set(false);
        this.toast.success(`🎉 ${res.message}`);
        this.auth.fetchProfile().subscribe();
        this.loadWallet();
      },
      error: () => {
        this.isRecharging.set(false);
      },
    });
  }
}
