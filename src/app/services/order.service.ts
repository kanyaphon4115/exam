import { Injectable } from '@angular/core';
import { defer, delay, Observable, of } from 'rxjs';
import { MOCK_ORDERS } from '../data/orders.mock';
import type { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  /** Replace the mock observable with HttpClient.get<readonly Order[]>(url) later. */
  getOrders(): Observable<readonly Order[]> {
    return defer(() => of(MOCK_ORDERS.map(order => ({ ...order })))).pipe(delay(600));
  }
}
