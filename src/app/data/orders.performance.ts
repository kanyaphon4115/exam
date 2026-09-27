import type { Order } from '../models/order.model';
import { MOCK_ORDERS } from './orders.mock';

/** Deterministic development fixture, never a replacement for production data. */
export function generatePerformanceOrders(count = 5000): readonly Order[] {
  return Array.from({ length: count }, (_, index) => ({
    ...MOCK_ORDERS[index % MOCK_ORDERS.length],
    id: index + 1,
    number: `PERF${String(index + 1).padStart(6, '0')}`,
  }));
}
