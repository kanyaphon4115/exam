import { TestBed } from '@angular/core/testing';
import { OrderDashboardComponent } from './order-dashboard';
import { Subject } from 'rxjs';
import type { Order } from '../models/order.model';
import { OrderService } from '../services/order.service';

describe('Order List transformations', () => {
  it('handles service loading, error, retry, and successful empty results', async () => {
    const first = new Subject<readonly Order[]>();
    const retry = new Subject<readonly Order[]>();
    const getOrders = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(retry);
    TestBed.configureTestingModule({ providers: [{ provide: OrderService, useValue: { getOrders } }] });
    const fixture = TestBed.createComponent(OrderDashboardComponent);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="status"]')?.textContent).toContain('กำลังโหลดข้อมูล...');
    first.error(new Error('Test service failure'));
    await fixture.whenStable();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('ไม่สามารถโหลดข้อมูลได้');
    page.querySelector('button')!.click();
    fixture.detectChanges();
    expect(getOrders).toHaveBeenCalledTimes(2);
    expect(page.querySelector('[aria-busy]')?.getAttribute('aria-busy')).toBe('true');
    retry.next([]);
    retry.complete();
    await fixture.whenStable();
    expect(page.querySelector('[role="status"]')?.textContent).toContain('ไม่พบรายการคำสั่งซื้อ');
    expect(page.querySelector('table')).toBeNull();
    expect(document.activeElement).toBe(page.querySelector('input'));
  });

  it('updates child expansion in response to the detail output', async () => {
    const fixture = TestBed.createComponent(OrderDashboardComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const button = page.querySelector('tbody button')!;
    button.dispatchEvent(new MouseEvent('click'));
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(page.querySelector<HTMLElement>('#dashboard-orders-details-2')?.hidden).toBe(false);
    button.dispatchEvent(new MouseEvent('click'));
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('unsubscribes from outstanding service requests when destroyed', () => {
    const source = new Subject<readonly Order[]>();
    TestBed.configureTestingModule({ providers: [{ provide: OrderService, useValue: { getOrders: () => source } }] });
    const fixture = TestBed.createComponent(OrderDashboardComponent);
    fixture.detectChanges();
    expect(source.observed).toBe(true);
    fixture.destroy();
    expect(source.observed).toBe(false);
  });
  it('renders Thai dates and grouped totals while preserving machine-readable dates', async () => {
    const fixture = TestBed.createComponent(OrderDashboardComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('time')?.textContent).toBe('01/02/2564 10:10 น.');
    expect(page.querySelector('time')?.getAttribute('datetime')).toBe('2021-02-01T10:10:12');
    expect(page.querySelectorAll('.order-summary dt')).toHaveLength(2);
    expect(page.querySelector('.order-summary')?.textContent).toContain('9,750.00');
    expect(page.querySelector('.order-summary')?.textContent).toContain('11,980.00');
  });

  it('updates the summary with search results and hides it for empty results', async () => {
    const fixture = TestBed.createComponent(OrderDashboardComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const input = page.querySelector('input')!;
    input.value = 'Icomputer';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(page.querySelectorAll('.order-summary dt')).toHaveLength(1);
    expect(page.querySelector('.order-summary strong')?.textContent).toContain('9,750.00');
    expect(page.querySelectorAll('tbody button')).toHaveLength(2);
    input.value = 'no-match';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(page.querySelector('.order-summary')).toBeNull();
    expect(page.querySelector('[role="status"]')?.textContent).toContain('ไม่พบรายการคำสั่งซื้อ');
  });
});
