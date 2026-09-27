import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MOCK_ORDERS } from '../data/orders.mock';
import { OrderService } from './order.service';

describe('OrderService', () => {
  it('returns separate copies without exposing the shared mock objects', async () => {
    const service = TestBed.inject(OrderService);
    const first = await firstValueFrom(service.getOrders());
    const second = await firstValueFrom(service.getOrders());
    expect(first).toEqual(MOCK_ORDERS);
    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
    expect(first[0]).not.toBe(MOCK_ORDERS[0]);
  });
});
