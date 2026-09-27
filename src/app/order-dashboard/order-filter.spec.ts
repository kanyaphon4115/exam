import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrderService } from '../services/order.service';
import { OrderDashboardComponent } from './order-dashboard';

describe('Reactive order filters', () => {
  function setup() {
    const getOrdersPage = vi.fn().mockReturnValue(of({ items: [], total: 0 }));
    TestBed.configureTestingModule({ providers: [{ provide: OrderService, useValue: { getOrdersPage } }] });
    const fixture = TestBed.createComponent(OrderDashboardComponent);
    fixture.detectChanges();
    const form = fixture.componentInstance.filterForm;
    const page = fixture.nativeElement as HTMLElement;
    const submit = () => page.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    return { fixture, form, page, submit, getOrdersPage };
  }

  it('allows empty filters, one-sided ranges and ordered or equal dates', () => {
    const { form } = setup();
    expect(form.valid).toBe(true);
    form.patchValue({ dateFrom: '01/01/2563' });
    expect(form.valid).toBe(true);
    form.patchValue({ dateTo: '31/12/2563' });
    expect(form.valid).toBe(true);
    form.patchValue({ dateTo: '01/01/2563' });
    expect(form.valid).toBe(true);
    form.patchValue({ dateFrom: '' });
    expect(form.valid).toBe(true);
  });

  it('rejects reversed dates with linked accessible errors and never requests the API', () => {
    const { fixture, form, page, submit, getOrdersPage } = setup();
    form.patchValue({ dateFrom: '01/01/2564', dateTo: '31/12/2563' });
    fixture.detectChanges();
    expect(form.hasError('dateRange')).toBe(true);
    expect(page.querySelector('#date-range-error')?.textContent).toContain('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
    expect(page.querySelector('#date-from')?.getAttribute('aria-invalid')).toBe('true');
    expect(page.querySelector('#date-to')?.getAttribute('aria-describedby')).toContain('date-range-error');
    expect(page.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    submit();
    expect(getOrdersPage).toHaveBeenCalledTimes(1);
  });

  it('rejects long searches and unsupported statuses', () => {
    const { form, submit, getOrdersPage } = setup();
    form.controls.search.setValue('a'.repeat(101));
    submit();
    expect(form.controls.search.hasError('maxlength')).toBe(true);
    form.patchValue({ search: '', status: 'unknown' });
    submit();
    expect(form.controls.status.hasError('unsupportedStatus')).toBe(true);
    expect(getOrdersPage).toHaveBeenCalledTimes(1);
  });

  it('accepts the Buddhist Era range from the reported issue and sends Gregorian dates', () => {
    const { form, submit, getOrdersPage } = setup();
    form.patchValue({ dateFrom: '01/02/2564', dateTo: '27/09/2569' });
    expect(form.valid).toBe(true);
    submit();
    expect(getOrdersPage).toHaveBeenLastCalledWith({ search: '', dateFrom: '2021-02-01', dateTo: '2026-09-27', page: 1 }, false);
  });

  it('rejects impossible dates without requesting the API and associates the error with the field', () => {
    const { fixture, form, page, submit, getOrdersPage } = setup();
    form.controls.dateFrom.setValue('31/02/2569');
    fixture.detectChanges();
    expect(form.controls.dateFrom.hasError('buddhistDate')).toBe(true);
    expect(page.querySelector('#date-from')?.getAttribute('aria-invalid')).toBe('true');
    expect(page.querySelector('#date-from-error')?.textContent).toContain('พ.ศ.');
    submit();
    expect(getOrdersPage).toHaveBeenCalledTimes(1);
  });

  it('submits all filters with trimmed search and resets to the unfiltered list', () => {
    const { form, page, submit, getOrdersPage } = setup();
    form.setValue({ search: '  Icomputer  ', status: 'ส่งของแล้ว', dateFrom: '01/01/2563', dateTo: '31/12/2563' });
    submit();
    expect(getOrdersPage).toHaveBeenLastCalledWith({ search: 'icomputer', status: 'ส่งของแล้ว', dateFrom: '2020-01-01', dateTo: '2020-12-31', page: 1 }, false);
    expect(form.controls.search.value).toBe('Icomputer');
    page.querySelector<HTMLButtonElement>('.filter-actions button[type="button"]')!.click();
    expect(form.getRawValue()).toEqual({ search: '', status: '', dateFrom: '', dateTo: '' });
    expect(getOrdersPage).toHaveBeenLastCalledWith({ search: '', page: 1 }, true);
  });

  it('cancels pending search on reset and accepts the same search again', () => {
    vi.useFakeTimers();
    const { fixture, page, getOrdersPage } = setup();
    try {
      const input = page.querySelector('input')!;
      input.value = 'shop'; input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      input.value = 'pending'; input.dispatchEvent(new Event('input'));
      page.querySelector<HTMLButtonElement>('.filter-actions button[type="button"]')!.click();
      vi.advanceTimersByTime(300);
      expect(getOrdersPage).toHaveBeenCalledTimes(3);
      expect(getOrdersPage).toHaveBeenLastCalledWith({ search: '', page: 1 }, true);
      input.value = 'shop'; input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(getOrdersPage).toHaveBeenLastCalledWith({ search: 'shop', page: 1 }, false);
      expect(getOrdersPage).toHaveBeenCalledTimes(4);
    } finally { fixture.destroy(); vi.useRealTimers(); }
  });
});
