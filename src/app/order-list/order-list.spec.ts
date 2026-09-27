import { TestBed } from '@angular/core/testing';
import { OrderListComponent } from './order-list';

describe('Order List transformations', () => {
  it('renders Thai dates and grouped totals while preserving machine-readable dates', async () => {
    const fixture = TestBed.createComponent(OrderListComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('time')?.textContent).toBe('01/02/2564 10:10 น.');
    expect(page.querySelector('time')?.getAttribute('datetime')).toBe('2021-02-01T10:10:12');
    expect(page.querySelectorAll('.order-summary dt')).toHaveLength(2);
    expect(page.querySelector('.order-summary')?.textContent).toContain('9,750.00');
    expect(page.querySelector('.order-summary')?.textContent).toContain('11,980.00');
  });

  it('updates the summary with search results and hides it for empty results', async () => {
    const fixture = TestBed.createComponent(OrderListComponent);
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
