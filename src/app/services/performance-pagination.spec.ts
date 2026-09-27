import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { MOCK_ORDERS } from '../data/orders.mock';
import { OrderDashboardComponent } from '../order-dashboard/order-dashboard';
import { MockOrderStore, mockOrdersInterceptor } from './mock-orders.interceptor';
import { OrderService } from './order.service';
import { PerformanceMetrics } from './performance-metrics';

describe('Performance dataset pagination', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([mockOrdersInterceptor]))] });
    // Enable the dataset independently of production environment configuration.
    const metrics = TestBed.inject(PerformanceMetrics);
    Object.defineProperty(metrics, 'enabled', { value: true });
  });
  afterEach(() => vi.useRealTimers());

  it('returns 50 rows on each page and page 2 has no IDs from page 1', () => {
    const service = TestBed.inject(OrderService);
    const result = vi.fn();
    service.getOrdersPage({ page: 1 }).subscribe(result);
    service.getOrdersPage({ page: 2 }).subscribe(result);
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    const [first, second] = result.mock.calls.map(([page]) => page);
    expect(first.total).toBe(5000);
    expect(first.items).toHaveLength(50);
    expect(second.items).toHaveLength(50);
    expect(first.items[0].id).toBe(1);
    expect(second.items[0].id).toBe(51);
    const ids = new Set(first.items.map((order: { id: number }) => order.id));
    expect(second.items.some((order: { id: number }) => ids.has(order.id))).toBe(false);
    expect(MOCK_ORDERS).toHaveLength(3);
  });

  it('filters the full dataset before pagination, including status and date boundaries', () => {
    const result = vi.fn();
    TestBed.inject(OrderService).getOrdersPage({ search: 'Icomputer', status: 'ส่งของแล้ว', dateFrom: '2020-01-01', dateTo: '2020-12-31', page: 2 }).subscribe(result);
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    const page = result.mock.calls[0][0];
    expect(page.total).toBe(3333);
    expect(page.items).toHaveLength(50);
    expect(page.items.every((order: { shop: string; status: string; date: string }) => order.shop === 'Icomputer' && order.status === 'ส่งของแล้ว' && order.date === '2020-11-11')).toBe(true);
  });

  it('supports the last page, empty results beyond it and rejects oversized pages', () => {
    const result = vi.fn();
    const service = TestBed.inject(OrderService);
    service.getOrdersPage({ page: 100 }).subscribe(result);
    service.getOrdersPage({ page: 101 }).subscribe(result);
    const error = vi.fn();
    TestBed.inject(HttpClient).get('/api/orders?pageSize=5000').subscribe({ error });
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    expect(result.mock.calls[0][0].items).toHaveLength(50);
    expect(result.mock.calls[0][0].items[49].id).toBe(5000);
    expect(result.mock.calls[1][0].items).toEqual([]);
    expect(error.mock.calls[0][0].status).toBe(400);
  });

  it('renders only 50 order rows, navigates pages and resets to page 1 after filtering', () => {
    const fixture = TestBed.createComponent(OrderDashboardComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('tbody tr')).toHaveLength(50);
    expect(page.querySelector('.pagination')?.textContent).toContain('1–50 จาก 5,000');
    expect(page.querySelector('.performance-info')?.textContent).toContain('Rows rendered: 50');
    const buttons = page.querySelectorAll<HTMLButtonElement>('.pagination button');
    expect(buttons[0].disabled).toBe(true);
    buttons[1].click();
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    fixture.detectChanges();
    expect(page.querySelector('tbody th')?.textContent).toBe('51');
    expect(page.querySelector('.pagination')?.textContent).toContain('หน้า 2 / 100');
    expect(page.querySelector('.pagination')?.textContent).toContain('51–100 จาก 5,000');
    fixture.componentInstance.filterForm.controls.search.setValue('PERF005000');
    page.querySelector('search form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    vi.advanceTimersByTime(environment.mockApi.latencyMs);
    fixture.detectChanges();
    expect(page.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(page.querySelector('tbody th')?.textContent).toBe('5000');
    expect(page.querySelector('.pagination')?.textContent).toContain('หน้า 1 / 1');
    fixture.destroy();
  });

  it('retains the original three orders when performance mode is disabled', () => {
    Object.defineProperty(TestBed.inject(PerformanceMetrics), 'enabled', { value: false });
    expect(TestBed.inject(MockOrderStore).list('', '', 1)).toEqual(MOCK_ORDERS);
  });
});
