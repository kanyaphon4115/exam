import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MOCK_ORDERS } from '../data/orders.mock';
import { OrderService } from './order.service';

describe('Order read cache', () => {
  let service: OrderService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(OrderService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); vi.useRealTimers(); });

  it('shares in-flight page reads and reuses a successful response', () => {
    const result = vi.fn();
    service.getOrdersPage({ page: 1 }).subscribe(result);
    service.getOrdersPage({ page: 1 }).subscribe(result);
    http.expectOne(req => req.url === '/api/orders').flush(MOCK_ORDERS, { headers: { 'X-Total-Count': '5000' } });
    service.getOrdersPage({ page: 1 }).subscribe(result);
    http.expectNone(req => req.url === '/api/orders');
    expect(result).toHaveBeenCalledTimes(3);
    expect(result).toHaveBeenLastCalledWith({ items: MOCK_ORDERS, total: 5000 });
  });

  it('invalidates list and detail caches after successful PATCH', () => {
    service.getOrdersPage().subscribe();
    http.expectOne(req => req.url === '/api/orders').flush(MOCK_ORDERS);
    service.getOrderById(2).subscribe();
    http.expectOne('/api/orders/2').flush(MOCK_ORDERS[0]);
    const updated = { ...MOCK_ORDERS[0], status: 'ส่งของแล้ว' as const };
    service.updateOrderStatus(2, updated.status).subscribe();
    http.expectOne('/api/orders/2/status').flush(updated);
    const detail = vi.fn();
    service.getOrderById(2).subscribe(detail);
    http.expectOne('/api/orders/2').flush(updated);
    service.getOrdersPage().subscribe();
    http.expectOne(req => req.url === '/api/orders').flush([updated]);
    expect(detail).toHaveBeenCalledWith(updated);
  });

  it('does not cache errors and allows a new read', () => {
    service.getOrderById(2).subscribe({ error: () => undefined });
    http.expectOne('/api/orders/2').flush({}, { status: 404, statusText: 'Not found' });
    service.getOrderById(2).subscribe();
    http.expectOne('/api/orders/2').flush(MOCK_ORDERS[0]);
  });

  it('bypasses cache on refresh and expires successful entries after 30 seconds', () => {
    vi.useFakeTimers();
    service.getOrderById(2).subscribe();
    http.expectOne('/api/orders/2').flush(MOCK_ORDERS[0]);
    service.getOrderById(2, true).subscribe();
    http.expectOne('/api/orders/2').flush(MOCK_ORDERS[0]);
    vi.advanceTimersByTime(30001);
    service.getOrderById(2).subscribe();
    http.expectOne('/api/orders/2').flush(MOCK_ORDERS[0]);
  });

  it('cancels abandoned requests and does not leave a dead cache entry', () => {
    const subscription = service.getOrdersPage().subscribe();
    const request = http.expectOne(req => req.url === '/api/orders');
    subscription.unsubscribe();
    expect(request.cancelled).toBe(true);
    service.getOrdersPage().subscribe();
    http.expectOne(req => req.url === '/api/orders').flush([]);
  });

  it('does not reinsert an old in-flight response into cache after PATCH invalidation', () => {
    service.getOrdersPage().subscribe();
    const old = http.expectOne(req => req.url === '/api/orders');
    service.updateOrderStatus(2, 'ส่งของแล้ว').subscribe();
    http.expectOne('/api/orders/2/status').flush({ ...MOCK_ORDERS[0], status: 'ส่งของแล้ว' });
    old.flush(MOCK_ORDERS);
    service.getOrdersPage().subscribe();
    http.expectOne(req => req.url === '/api/orders').flush([]);
  });
});
