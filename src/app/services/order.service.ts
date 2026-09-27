import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, retry, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Order, OrderQuery } from '../models/order.model';

function retryReads<T>() {
  return retry<T>({
    count: 2,
    delay: (error: unknown, attempt: number) =>
      error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500)
        ? timer(300 * attempt)
        : throwError(() => error),
  });
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl.replace(/\/$/, '')}/orders`;

  getOrders(query: OrderQuery = {}): Observable<readonly Order[]> {
    let params = new HttpParams();
    if (query.search !== undefined) params = params.set('search', query.search);
    if (query.status !== undefined) params = params.set('status', query.status);
    if (query.page !== undefined) params = params.set('page', query.page);
    return this.http.get<readonly Order[]>(this.url, { params }).pipe(retryReads());
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.url}/${encodeURIComponent(id)}`).pipe(retryReads());
  }

  updateOrderStatus(id: number, status: Order['status']): Observable<Order> {
    // Do not automatically replay writes; let the caller handle failed PATCH requests.
    return this.http.patch<Order>(`${this.url}/${encodeURIComponent(id)}/status`, { status });
  }
}
