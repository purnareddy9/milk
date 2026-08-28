import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { User, Role } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public currentUserSignal = signal<User | null>(null);

  private readonly TOKEN_KEY = 'amrit_dairy_token';
  private readonly USER_KEY = 'amrit_dairy_user';

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService,
  ) {
    this.initAuth();
  }

  private initAuth() {
    const savedUser = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (savedUser && token) {
      try {
        const user: User = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
        // Refresh profile in background
        this.fetchProfile().subscribe();
      } catch {
        this.logout();
      }
    } else {
      // Default to Rahul Sharma for instant demo accessibility
      this.switchPersona('CUSTOMER_RAHUL').subscribe();
    }
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!this.token;
  }

  get isSeller(): boolean {
    return this.currentUser?.role === 'SELLER' || this.currentUser?.role === 'ADMIN';
  }

  get isDeliveryPerson(): boolean {
    return this.currentUser?.role === 'DELIVERY_PERSON';
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.api.post<{ user: User; accessToken: string }>('auth/login', credentials).pipe(
      tap((res) => {
        this.setSession(res.user, res.accessToken);
        this.toast.success(`Welcome back, ${res.user.name}!`);
      }),
    );
  }

  register(data: any): Observable<any> {
    return this.api.post<{ user: User; accessToken: string }>('auth/register', data).pipe(
      tap((res) => {
        this.setSession(res.user, res.accessToken);
        this.toast.success(`Welcome to Amrit Pure Dairy, ${res.user.name}!`);
      }),
    );
  }

  switchPersona(persona: 'CUSTOMER_RAHUL' | 'CUSTOMER_PRIYA' | 'SELLER_RAMESH' | 'DELIVERY_SURESH'): Observable<any> {
    return this.api.post<{ user: User; accessToken: string }>('auth/persona', { persona }).pipe(
      tap((res) => {
        this.setSession(res.user, res.accessToken);
        const roleLabel = res.user.role === 'SELLER' ? 'Seller / Admin' : res.user.role === 'DELIVERY_PERSON' ? 'Delivery Partner' : 'Customer';
        this.toast.info(`Switched active persona to ${res.user.name} (${roleLabel})`);
      }),
      catchError((err) => {
        console.warn('Backend persona switch failed, using local mock persona:', err);
        return of(null);
      }),
    );
  }

  fetchProfile(): Observable<User | null> {
    return this.api.get<User>('auth/me').pipe(
      tap((user) => {
        if (user) {
          this.currentUserSubject.next(user);
          this.currentUserSignal.set(user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
      }),
      catchError(() => of(null)),
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
    this.toast.info('You have been logged out.');
  }

  private setSession(user: User, token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
  }
}
