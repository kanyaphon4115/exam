import { TestBed } from '@angular/core/testing';
import { MOCK_ORDERS } from '../../data/orders.mock';
import { formatThaiDateTime } from '../../utils/order-transform';
import { OrderTableComponent } from './order-table';

describe('OrderTableComponent', () => {
  it('renders inputs and emits the row ID without managing expansion itself', async () => {
    const fixture = TestBed.createComponent(OrderTableComponent);
    fixture.componentRef.setInput('tableId', 'test-orders');
    fixture.componentRef.setInput('orders', MOCK_ORDERS.map(order => ({
      ...order, thaiDate: formatThaiDateTime(`${order.date} ${order.time}`),
    })));
    const onDetails = vi.fn();
    fixture.componentInstance.detailsRequested.subscribe(onDetails);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const button = page.querySelector('button')!;
    button.click();
    expect(onDetails).toHaveBeenCalledWith(2);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fixture.componentRef.setInput('expandedRow', 2);
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(page.querySelector<HTMLElement>('#test-orders-details-2')?.hidden).toBe(false);
    expect(page.querySelectorAll('th[scope="col"]')).toHaveLength(13);
    expect(page.querySelector('app-status-badge')?.textContent).toContain('ชำระเงินแล้ว');
  });
});
