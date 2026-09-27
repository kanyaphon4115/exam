import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, finalize, map, Observable, retry, shareReplay, tap, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Order, OrderPage, OrderQuery } from '../models/order.model';

interface CacheEntry<T> { value: Observable<T>; expires: number; }

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
  private readonly pages = new Map<string, CacheEntry<OrderPage>>();
  private readonly details = new Map<string, CacheEntry<Order>>();
  private readonly ttlMs = 30000;
  private readonly maxEntries = 40;

  getOrders(query: OrderQuery = {}): Observable<readonly Order[]> {
    return this.http.get<readonly Order[]>(this.url, { params: this.params(query) }).pipe(retryReads());
  }

  getOrdersPage(query: OrderQuery = {}, refresh = false): Observable<OrderPage> {
    const params = this.params({ ...query, pageSize: query.pageSize ?? 50 });
    return this.cached(this.pages, params.toString(), () =>
      this.http.get<readonly Order[]>(this.url, { params, observe: 'response' }).pipe(
        retryReads(),
        map(response => ({ items: response.body ?? [], total: Number(response.headers.get('X-Total-Count') ?? response.body?.length ?? 0) })),
      ), refresh);
  }

  private params(query: OrderQuery): HttpParams {
    let params = new HttpParams();
    if (query.search !== undefined) params = params.set('search', query.search);
    if (query.status !== undefined) params = params.set('status', query.status);
    if (query.dateFrom !== undefined) params = params.set('dateFrom', query.dateFrom);
    if (query.dateTo !== undefined) params = params.set('dateTo', query.dateTo);
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.pageSize !== undefined) params = params.set('pageSize', query.pageSize);
    return params;
  }

  getOrder(id: number): Observable<Order> {
    return this.getOrderById(id);
  }

  getOrderById(id: number, refresh = false): Observable<Order> {
    return this.cached(this.details, String(id), () =>
      this.http.get<Order>(`${this.url}/${encodeURIComponent(id)}`).pipe(retryReads()), refresh);
  }

  updateOrderStatus(id: number, status: Order['status']): Observable<Order> {
    // Do not automatically replay writes; let the caller handle failed PATCH requests.
    return this.http.patch<Order>(`${this.url}/${encodeURIComponent(id)}/status`, { status }).pipe(
      tap(() => { this.pages.clear(); this.details.clear(); }),
    );
  }

  /** Share active reads, cache successful completions only, and bound memory/time. */
  private cached<T>(cache: Map<string, CacheEntry<T>>, key: string, request: () => Observable<T>, refresh: boolean): Observable<T> {
    return defer(() => {
      const existing = cache.get(key);
      if (!refresh && existing && existing.expires > Date.now()) return existing.value;
      if (cache.size >= this.maxEntries) cache.delete(cache.keys().next().value!);
      const entry: CacheEntry<T> = { expires: Infinity, value: new Observable<T>() };
      let completed = false;
      entry.value = defer(request).pipe(
        tap({ complete: () => { completed = true; entry.expires = Date.now() + this.ttlMs; } }),
        finalize(() => {
          // Never remove a newer request, or restore a cache invalidated by PATCH.
          if (!completed && cache.get(key) === entry) cache.delete(key);
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      cache.set(key, entry);
      return entry.value;
    });
  }
}
