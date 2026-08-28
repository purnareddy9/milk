import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Notification } from '../../core/models';
import { format, parseISO } from 'date-fns';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container notif-page">
      <div class="page-head">
        <div>
          <span class="breadcrumb">Account / Notifications</span>
          <h1>Notifications & Alerts</h1>
          <p class="page-desc">Stay updated on your morning deliveries, subscriptions, and exclusive farm deals.</p>
        </div>
        <button class="btn btn-light btn-sm" (click)="markAllAsRead()">
          Mark all as read
        </button>
      </div>

      <div class="notifs-container card" *ngIf="notifications().length > 0">
        <div *ngFor="let notif of notifications()" class="notif-row" [class.unread]="!notif.isRead" (click)="markRead(notif)">
          <div class="notif-icon-box" [ngClass]="notif.type.toLowerCase()">
            <span *ngIf="notif.type === 'DELIVERY'">🚚</span>
            <span *ngIf="notif.type === 'SUBSCRIPTION'">🥛</span>
            <span *ngIf="notif.type === 'ORDER'">📦</span>
            <span *ngIf="notif.type === 'OFFER'">🎉</span>
            <span *ngIf="notif.type === 'SYSTEM'">🔔</span>
          </div>

          <div class="notif-content">
            <div class="notif-title-row">
              <strong>{{ notif.title }}</strong>
              <span class="notif-time">{{ formatDate(notif.createdAt) }}</span>
            </div>
            <p class="notif-msg">{{ notif.message }}</p>
          </div>

          <div class="unread-dot" *ngIf="!notif.isRead"></div>
        </div>
      </div>

      <div class="empty-notifs card" *ngIf="notifications().length === 0">
        <span class="empty-icon">🔔</span>
        <h2>No Notifications</h2>
        <p>You're all caught up! Updates regarding your milk deliveries will appear here.</p>
      </div>
    </div>
  `,
  styles: [`
    .notif-page { padding: 32px 20px 60px; }
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
      .breadcrumb { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; display: block; }
      h1 { font-size: 2rem; margin-bottom: 6px; }
      .page-desc { color: var(--text-muted); font-size: 0.95rem; }
    }

    .notifs-container {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .notif-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:last-child { border-bottom: none; }
      &:hover { background-color: var(--bg-app); }

      &.unread {
        background-color: #f6fbf8;
      }
    }

    .notif-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      background-color: var(--bg-app);
      flex-shrink: 0;

      &.delivery { background-color: var(--primary-subtle); }
      &.subscription { background-color: var(--cream-surface); }
      &.order { background-color: var(--sky-subtle); }
    }

    .notif-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .notif-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;

        strong { font-size: 0.95rem; color: var(--text-main); }
        .notif-time { font-size: 0.75rem; color: var(--text-muted); }
      }

      .notif-msg {
        font-size: 0.85rem;
        color: var(--text-body);
        line-height: 1.4;
      }
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--primary);
      flex-shrink: 0;
    }

    .empty-notifs {
      text-align: center;
      padding: 60px 20px;
      .empty-icon { font-size: 3.5rem; margin-bottom: 12px; }
      h2 { font-size: 1.3rem; margin-bottom: 6px; }
      p { color: var(--text-muted); }
    }
  `],
})
export class NotificationsComponent implements OnInit {
  api = inject(ApiService);
  notifications = signal<Notification[]>([]);

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.api.get<{ unreadCount: number; notifications: Notification[] }>('notifications').subscribe({
      next: (res) => this.notifications.set(res?.notifications || []),
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return format(parseISO(dateStr), 'dd MMM, hh:mm a');
  }

  markRead(notif: Notification) {
    if (!notif.isRead) {
      this.api.patch(`notifications/${notif.id}/read`).subscribe(() => {
        notif.isRead = true;
      });
    }
  }

  markAllAsRead() {
    this.api.patch('notifications/read-all').subscribe(() => {
      const current = this.notifications().map((n) => ({ ...n, isRead: true }));
      this.notifications.set(current);
    });
  }
}
