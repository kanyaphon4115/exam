import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { MOCK_ORDERS } from '../data/orders.mock';
import type { Order } from '../models/order.model';

/** In-memory mock database; shared fixtures and pure-function inputs stay unchanged. */
@Injectable({ providedIn: 'root' })
export class MockOrderStore {
  private orders: readonly Order[] = MOCK_ORDERS.map(order => ({ ...order }));
  forceError = environment.mockApi.forceError;

  list(search: string, status: string, page: number): readonly Order[] {
    const query = search.trim().toLowerCase();
    return this.orders.filter(order =>
      (!status || order.status === status) &&
      (order.shop.toLowerCase().includes(query) || order.number.toLowerCase().includes(query)),
    ).slice((page - 1) * 10, page * 10).map(order => ({ ...order }));
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
  const fail = (status: number, message: string): never => {
    throw new HttpErrorResponse({ status, url: request.urlWithParams, error: { message } });
  };
  return timer(environment.mockApi.latencyMs).pipe(map(() => {
    if (store.forceError) return fail(503, 'Mock service unavailable');
    const suffix = path.slice(base.length);
    if (!suffix && request.method === 'GET') {
      const urlParams = new URLSearchParams(request.urlWithParams.split('?')[1] ?? '');
      const page = Number(urlParams.get('page') ?? 1);
      const status = urlParams.get('status') ?? '';
      if (!Number.isInteger(page) || page < 1) return fail(400, 'Invalid page');
      if (status && status !== 'ชำระเงินแล้ว' && status !== 'ส่งของแล้ว') return fail(400, 'Invalid status');
      return new HttpResponse({ status: 200, body: store.list(urlParams.get('search') ?? '', status, page) });
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
