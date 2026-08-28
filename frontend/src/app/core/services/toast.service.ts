import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'danger' | 'info' | 'warning';
  title?: string;
  message: string;
  timeoutId?: any;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'info', title?: string, duration: number = 4000) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const timeoutId = setTimeout(() => {
      this.remove(id);
    }, duration);

    const newToast: Toast = { id, type, title, message, timeoutId };
    this.toastsSubject.next([...this.toastsSubject.value, newToast]);
  }

  success(message: string, title?: string) {
    this.show(message, 'success', title || 'Success');
  }

  error(message: string, title?: string) {
    this.show(message, 'danger', title || 'Error');
  }

  info(message: string, title?: string) {
    this.show(message, 'info', title || 'Notice');
  }

  warning(message: string, title?: string) {
    this.show(message, 'warning', title || 'Warning');
  }

  remove(id: string) {
    const current = this.toastsSubject.value;
    const target = current.find((t) => t.id === id);
    if (target?.timeoutId) {
      clearTimeout(target.timeoutId);
    }
    this.toastsSubject.next(current.filter((t) => t.id !== id));
  }
}
