import { MOCK_ORDERS } from './orders.mock';
import { generatePerformanceOrders } from './orders.performance';
import { formatThaiDateTime } from '../utils/order-transform';

describe('Performance orders generator', () => {
  it('generates 5,000 valid rows with unique identities without changing the original fixtures', () => {
    const before = JSON.stringify(MOCK_ORDERS);
    const orders = generatePerformanceOrders();
    expect(orders).toHaveLength(5000);
    expect(new Set(orders.map(order => order.id)).size).toBe(5000);
    expect(new Set(orders.map(order => order.number)).size).toBe(5000);
    expect(orders[4999].number).toBe('PERF005000');
    expect(orders[0]).not.toBe(MOCK_ORDERS[0]);
    for (const order of orders) {
      expect(() => formatThaiDateTime(`${order.date} ${order.time}`)).not.toThrow();
    }
    expect(MOCK_ORDERS).toHaveLength(3);
    expect(JSON.stringify(MOCK_ORDERS)).toBe(before);
  });
});
