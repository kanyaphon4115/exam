import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { MOCK_ORDERS } from '../data/orders.mock';
import type { Order } from '../models/order.model';
import { generatePerformanceOrders } from '../data/orders.performance';
import { PerformanceMetrics } from './performance-metrics';

/** In-memory mock database; shared fixtures and pure-function inputs stay unchanged. */
@Injectable({ providedIn: 'root' })
export class MockOrderStore {
  private readonly metrics = inject(PerformanceMetrics);
  private orders: readonly Order[] = this.metrics.enabled ? generatePerformanceOrders() : MOCK_ORDERS.map(order => ({ ...order }));
  forceError = environment.mockApi.forceError;

  matching(search: string, status: string, dateFrom = '', dateTo = ''): readonly Order[] {
    const query = search.trim().toLowerCase();
    return this.orders.filter(order =>
      (!dateFrom || order.date >= dateFrom) && (!dateTo || order.date <= dateTo) &&
      (!status || order.status === status) &&
      (order.shop.toLowerCase().includes(query) || order.number.toLowerCase().includes(query)),
    );
  }

  list(search: string, status: string, page: number, dateFrom = '', dateTo = '', pageSize = 10): readonly Order[] {
    return this.matching(search, status, dateFrom, dateTo)
      .slice((page - 1) * pageSize, page * pageSize).map(order => ({ ...order }));
  }

  get(id: number): Order | undefined {
    const order = this.orders.find(item => item.id === id);
    return order ? { ...order } : undefined;
  }

  update(id: number, status: Order['status']): Order {
    this.orders = this.orders.map(order => order.id === id ? { ...order, status } : order);
    return this.get(id)!;
  }
}

export const mockOrdersInterceptor: HttpInterceptorFn = (request, next) => {
  const base = `${environment.apiBaseUrl.replace(/\/$/, '')}/orders`;
  const path = request.url.split('?')[0];
  if (!environment.mockApi.enabled || (path !== base && !path.startsWith(`${base}/`))) {
    return next(request);
  }
  const store = inject(MockOrderStore);
  inject(PerformanceMetrics).request(request.method, request.urlWithParams);
  const fail = (status: number, message: string): never => {
    throw new HttpErrorResponse({ status, url: request.urlWithParams, error: { message } });
  };
  return timer(environment.mockApi.latencyMs).pipe(map(() => {
    if (store.forceError) return fail(503, 'Mock service unavailable');
    const suffix = path.slice(base.length);
    if (!suffix && request.method === 'GET') {
      const urlParams = new URLSearchParams(request.urlWithParams.split('?')[1] ?? '');
      const page = Number(urlParams.get('page') ?? 1);
      const pageSize = Number(urlParams.get('pageSize') ?? 10);
      const status = urlParams.get('status') ?? '';
      if (!Number.isInteger(page) || page < 1) return fail(400, 'Invalid page');
      if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) return fail(400, 'Invalid page size');
      if (status && status !== 'ชำระเงินแล้ว' && status !== 'ส่งของแล้ว') return fail(400, 'Invalid status');
      const matches = store.matching(urlParams.get('search') ?? '', status, urlParams.get('dateFrom') ?? '', urlParams.get('dateTo') ?? '');
      return new HttpResponse({ status: 200,
        headers: { 'X-Total-Count': String(matches.length) },
        body: matches.slice((page - 1) * pageSize, page * pageSize).map(order => ({ ...order })),
      });
    }
    const match = /^\/(\d+)(\/status)?$/.exec(suffix);
    if (!match) return fail(404, 'Unknown endpoint');
    const id = Number(match[1]);
    const order = store.get(id);
    if (!order) return fail(404, 'Order not found');
    if (!match[2] && request.method === 'GET') return new HttpResponse({ status: 200, body: order });
    if (match[2] && request.method === 'PATCH') {
      const status = (request.body as { status?: unknown } | null)?.status;
      if (status !== 'ชำระเงินแล้ว' && status !== 'ส่งของแล้ว') return fail(400, 'Invalid status');
      return new HttpResponse({ status: 200, body: store.update(id, status) });
    }
    return fail(405, 'Method not allowed');
  }));
};
