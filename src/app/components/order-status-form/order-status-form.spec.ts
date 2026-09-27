import { TestBed } from '@angular/core/testing';
import { MOCK_ORDERS } from '../../data/orders.mock';
import { OrderStatusFormComponent } from './order-status-form';

describe('OrderStatusFormComponent', () => {
  it('labels the select, emits status, and prevents submissions while saving', async () => {
    const fixture = TestBed.createComponent(OrderStatusFormComponent);
    fixture.componentRef.setInput('order', MOCK_ORDERS[0]);
    fixture.componentRef.setInput('controlId', 'test-status');
    const submitted = vi.fn();
    fixture.componentInstance.statusSubmitted.subscribe(submitted);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('label')?.htmlFor).toBe('test-status');
    const select = page.querySelector('select')!;
    expect(select.value).toBe('ชำระเงินแล้ว');
    select.value = 'ส่งของแล้ว';
    page.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(submitted).toHaveBeenCalledWith('ส่งของแล้ว');
    fixture.componentRef.setInput('state', 'saving');
    await fixture.whenStable();
    expect(page.querySelector('button')?.disabled).toBe(true);
    expect(select.disabled).toBe(true);
    page.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(submitted).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('state', 'error');
    await fixture.whenStable();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('ไม่สามารถอัปเดตสถานะได้');
  });
});
