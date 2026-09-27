import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { MOCK_ORDERS } from '../data/orders.mock';
import { OrderDashboardComponent } from './order-dashboard';

const url = `${environment.apiBaseUrl}/orders`;
describe('Dashboard detail and status API integration', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  async function setup() {
    const fixture = TestBed.createComponent(OrderDashboardComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne(req => req.url === url).flush(MOCK_ORDERS);
    await fixture.whenStable();
    return { fixture, http, page: fixture.nativeElement as HTMLElement };
  }

  it('loads details from GET and updates list and details with the PATCH response', async () => {
    const { fixture, http, page } = await setup();
    page.querySelector<HTMLButtonElement>('tbody button')!.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('กำลังโหลดรายละเอียด...');
    expect(page.querySelector('app-order-status-form select')).toBeNull();
    const detail = { ...MOCK_ORDERS[0], item: 'Detail returned by API' };
    http.expectOne(`${url}/2`).flush(detail);
    await fixture.whenStable();
    expect(page.querySelector('.details-row:not([hidden])')?.textContent).toContain(detail.item);
    const select = page.querySelector<HTMLSelectElement>('app-order-status-form select')!;
    select.value = 'ส่งของแล้ว';
    select.dispatchEvent(new Event('change'));
    page.querySelector('app-order-status-form form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(page.querySelector<HTMLButtonElement>('app-order-status-form button[type="submit"]')!.disabled).toBe(true);
    expect(page.textContent).toContain('กำลังบันทึก...');
    const patch = http.expectOne(`${url}/2/status`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ status: 'ส่งของแล้ว' });
    patch.flush({ ...detail, status: 'ส่งของแล้ว' });
    await fixture.whenStable();
    expect(page.textContent).toContain('อัปเดตสถานะสำเร็จ');
    expect(page.querySelector('app-status-badge')?.textContent).toBe('ส่งของแล้ว');
    expect(page.querySelector('.details-row:not([hidden])')?.textContent).toContain('ส่งของแล้ว');
    expect(page.querySelector<HTMLButtonElement>('app-order-status-form button[type="submit"]')!.disabled).toBe(false);
  });

  it('shows a detail error and retries GET on request', async () => {
    const { fixture, http, page } = await setup();
    page.querySelector<HTMLButtonElement>('tbody button')!.click();
    http.expectOne(`${url}/2`).flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(page.textContent).toContain('ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง');
    page.querySelector<HTMLButtonElement>('.details-row:not([hidden]) button')!.click();
    http.expectOne(`${url}/2`).flush(MOCK_ORDERS[0]);
    await fixture.whenStable();
    expect(page.querySelector('app-order-status-form select')).not.toBeNull();
  });

  it('retains the old status on PATCH error and allows deliberate resubmission', async () => {
    const { fixture, http, page } = await setup();
    page.querySelector<HTMLButtonElement>('tbody button')!.click();
    http.expectOne(`${url}/2`).flush(MOCK_ORDERS[0]);
    await fixture.whenStable();
    page.querySelector<HTMLSelectElement>('app-order-status-form select')!.value = 'ส่งของแล้ว';
    page.querySelector('app-order-status-form select')!.dispatchEvent(new Event('change'));
    const form = page.querySelector('app-order-status-form form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    http.expectOne(`${url}/2/status`).flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(page.textContent).toContain('ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง');
    expect(page.querySelector('app-status-badge')?.textContent).toBe('ชำระเงินแล้ว');
    http.expectNone(`${url}/2/status`);
    expect((page.querySelector('app-order-status-form select') as HTMLSelectElement).value).toBe('ชำระเงินแล้ว');
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    http.expectOne(`${url}/2/status`).flush({ ...MOCK_ORDERS[0], status: 'ส่งของแล้ว' });
    await fixture.whenStable();
    expect(page.textContent).toContain('อัปเดตสถานะสำเร็จ');
  });

  it('cancels obsolete detail requests and cancels a pending PATCH on destroy', async () => {
    const { fixture, http, page } = await setup();
    const buttons = page.querySelectorAll<HTMLButtonElement>('tbody tr:not(.details-row) button');
    buttons[0].click();
    const old = http.expectOne(`${url}/2`);
    buttons[1].click();
    expect(old.cancelled).toBe(true);
    http.expectOne(`${url}/4`).flush(MOCK_ORDERS[1]);
    await fixture.whenStable();
    page.querySelector('app-order-status-form form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    const patch = http.expectOne(`${url}/4/status`);
    fixture.destroy();
    expect(patch.cancelled).toBe(true);
  });
});
