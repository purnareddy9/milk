import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="(toastService.toasts$ | async) as toasts">
      <div
        *ngFor="let toast of toasts"
        class="toast-item toast-{{ toast.type }}"
        (click)="toastService.remove(toast.id)"
      >
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">✅</span>
          <span *ngIf="toast.type === 'danger'">⚠️</span>
          <span *ngIf="toast.type === 'info'">🥛</span>
          <span *ngIf="toast.type === 'warning'">🔔</span>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-title {
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 2px;
    }
    .toast-msg {
      font-size: 0.85rem;
      color: var(--text-body);
    }
    .toast-icon {
      font-size: 1.25rem;
    }
  `],
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
