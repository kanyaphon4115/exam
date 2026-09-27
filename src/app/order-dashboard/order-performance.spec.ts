import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MOCK_ORDERS } from '../data/orders.mock';
import { OrderDashboardComponent } from './order-dashboard';

describe('Order dashboard request regressions', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('does not repeat the initial GET when the same filter is submitted twice', async () => {
    const fixture = TestBed.createComponent(OrderDashboardComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne(req => req.url === '/api/orders').flush(MOCK_ORDERS);
    await fixture.whenStable();
    const form = (fixture.nativeElement as HTMLElement).querySelector('search form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    http.expectNone(req => req.url === '/api/orders');
  });
});
