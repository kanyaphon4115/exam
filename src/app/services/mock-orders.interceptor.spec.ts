import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { MOCK_ORDERS } from '../data/orders.mock';
import { MockOrderStore, mockOrdersInterceptor } from './mock-orders.interceptor';
import { OrderService } from './order.service';

const url = `${environment.apiBaseUrl}/orders`;
describe('Mock orders API', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([mockOrdersInterceptor]))] });
  });
  afterEach(() => vi.useRealTimers());

  it('filters by search/status and paginates', () => {
    const result = vi.fn();
    const service = TestBed.inject(OrderService);
    service.getOrders({ search: 'Icomputer', status: 'ส่งของแล้ว', page: 1 }).subscribe(result);
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    expect(result.mock.calls[0][0].map((order: { id: number }) => order.id)).toEqual([4, 5]);
    service.getOrders({ page: 2 }).subscribe(result);
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    expect(result).toHaveBeenLastCalledWith([]);
  });

  it('persists PATCH in memory and returns copies without mutating fixtures', () => {
    const service = TestBed.inject(OrderService);
    const result = vi.fn();
    service.updateOrderStatus(2, 'ส่งของแล้ว').subscribe(result);
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    expect(result.mock.calls[0][0].status).toBe('ส่งของแล้ว');
    service.getOrder(2).subscribe(result);
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    expect(result.mock.calls[1][0].status).toBe('ส่งของแล้ว');
    expect(result.mock.calls[0][0]).not.toBe(result.mock.calls[1][0]);
    expect(MOCK_ORDERS[0].status).toBe('ชำระเงินแล้ว');
  });

  it('rejects unknown IDs and invalid status/page', () => {
    const http = TestBed.inject(HttpClient);
    const error = vi.fn();
    http.get(`${url}/999`).subscribe({ error });
    http.get(`${url}?page=0`).subscribe({ error });
    http.patch(`${url}/2/status`, { status: 'invalid' }).subscribe({ error });
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    expect(error.mock.calls.map(([err]) => err.status)).toEqual([404, 400, 400]);
  });

  it('supports a simulated service error', () => {
    TestBed.inject(MockOrderStore).forceError = true;
    const error = vi.fn();
    TestBed.inject(HttpClient).get(url).subscribe({ error });
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    expect(error.mock.calls[0][0].status).toBe(503);
  });

  it('does not apply a cancelled write', () => {
    const service = TestBed.inject(OrderService);
    const subscription = service.updateOrderStatus(2, 'ส่งของแล้ว').subscribe();
    subscription.unsubscribe();
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    expect(TestBed.inject(MockOrderStore).get(2)?.status).toBe('ชำระเงินแล้ว');
  });
});
