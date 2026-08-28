import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private get baseUrl(): string {
    const customUrl = (window as any).__AMRIT_API_URL__ || localStorage.getItem('amrit_api_url');
    if (customUrl) return customUrl;
    // Check if running on production domain
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
    return 'http://localhost:3000/api';
  }

  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, { params: httpParams })
      .pipe(map((res) => (res && res.data !== undefined ? res.data : (res as any))));
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body)
      .pipe(map((res) => (res && res.data !== undefined ? res.data : (res as any))));
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body)
      .pipe(map((res) => (res && res.data !== undefined ? res.data : (res as any))));
  }

  patch<T>(endpoint: string, body?: any): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body || {})
      .pipe(map((res) => (res && res.data !== undefined ? res.data : (res as any))));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`)
      .pipe(map((res) => (res && res.data !== undefined ? res.data : (res as any))));
  }
}
