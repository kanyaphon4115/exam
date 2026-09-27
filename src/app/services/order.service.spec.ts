import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { MOCK_ORDERS } from '../data/orders.mock';
import { OrderService } from './order.service';

const url = `${environment.apiBaseUrl}/orders`;

describe('OrderService HTTP contract', () => {
  let http: HttpTestingController;
  let service: OrderService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(OrderService);
  });
  afterEach(() => { http.verify(); vi.useRealTimers(); });

  it('GETs orders without query parameters', () => {
    const result = vi.fn();
    service.getOrders().subscribe(result);
    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    request.flush(MOCK_ORDERS);
    expect(result).toHaveBeenCalledWith(MOCK_ORDERS);
  });

  it('encodes search, status and page parameters', () => {
    service.getOrders({ search: 'A & B', status: 'ส่งของแล้ว', page: 2 }).subscribe();
    const request = http.expectOne(req => req.url === url);
    expect(request.request.params.get('search')).toBe('A & B');
    expect(request.request.params.get('status')).toBe('ส่งของแล้ว');
    expect(request.request.params.get('page')).toBe('2');
    request.flush([]);
  });

  it('sends both date boundaries as HttpParams', () => {
    service.getOrders({ dateFrom: '2020-01-01', dateTo: '2020-12-31' }).subscribe();
    const request = http.expectOne(req => req.url === url);
    expect(request.request.params.get('dateFrom')).toBe('2020-01-01');
    expect(request.request.params.get('dateTo')).toBe('2020-12-31');
    request.flush([]);
  });

  it('GETs a single row by its unique ID', () => {
    service.getOrder(4).subscribe();
    const request = http.expectOne(`${url}/4`);
    expect(request.request.method).toBe('GET');
    request.flush(MOCK_ORDERS[1]);
  });

  it('PATCHes only status and does not retry a failed write', () => {
    vi.useFakeTimers();
    const error = vi.fn();
    service.updateOrderStatus(2, 'ส่งของแล้ว').subscribe({ error });
    const request = http.expectOne(`${url}/2/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'ส่งของแล้ว' });
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(2000);
    http.expectNone(`${url}/2/status`);
    expect(error).toHaveBeenCalledOnce();
  });

  it('retries a transient failure twice then reports the error', () => {
    vi.useFakeTimers();
    const error = vi.fn();
    service.getOrders().subscribe({ error });
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(300);
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(600);
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(2000);
    http.expectNone(url);
    expect(error).toHaveBeenCalledOnce();
  });

  it('can recover on a retry after a network error', () => {
    vi.useFakeTimers();
    const result = vi.fn();
    service.getOrders().subscribe(result);
    http.expectOne(url).error(new ProgressEvent('error'));
    vi.advanceTimersByTime(300);
    http.expectOne(url).flush(MOCK_ORDERS);
    expect(result).toHaveBeenCalledWith(MOCK_ORDERS);
  });

  it('does not retry a 404', () => {
    vi.useFakeTimers();
    const error = vi.fn();
    service.getOrder(999).subscribe({ error });
    http.expectOne(`${url}/999`).flush({}, { status: 404, statusText: 'Not Found' });
    vi.advanceTimersByTime(2000);
    http.expectNone(`${url}/999`);
    expect(error).toHaveBeenCalledOnce();
  });

  it('cancels an HTTP request on unsubscribe', () => {
    const subscription = service.getOrders().subscribe();
    const request = http.expectOne(url);
    subscription.unsubscribe();
    expect(request.cancelled).toBe(true);
  });
});
