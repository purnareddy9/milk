import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { Subscription, SubscriptionDelivery } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService,
  ) {}

  getMySubscriptions(): Observable<Subscription[]> {
    return this.api.get<Subscription[]>('subscriptions/my');
  }

  getCalendarFeed(startDate?: string, endDate?: string): Observable<SubscriptionDelivery[]> {
    return this.api.get<SubscriptionDelivery[]>('subscriptions/calendar', { startDate, endDate });
  }

  createSubscription(data: any): Observable<Subscription> {
    return this.api.post<Subscription>('subscriptions', data);
  }

  skipDelivery(subscriptionId: string, deliveryDate: string): Observable<any> {
    return this.api.post(`subscriptions/${subscriptionId}/skip`, { deliveryDate });
  }

  pauseSubscription(subscriptionId: string, pauseStartDate: string, pauseEndDate: string): Observable<any> {
    return this.api.post(`subscriptions/${subscriptionId}/pause`, { pauseStartDate, pauseEndDate });
  }

  resumeSubscription(subscriptionId: string): Observable<any> {
    return this.api.post(`subscriptions/${subscriptionId}/resume`, {});
  }

  updateSubscription(subscriptionId: string, data: any): Observable<Subscription> {
    return this.api.put<Subscription>(`subscriptions/${subscriptionId}`, data);
  }

  cancelSubscription(subscriptionId: string): Observable<any> {
    return this.api.delete(`subscriptions/${subscriptionId}`);
  }
}
