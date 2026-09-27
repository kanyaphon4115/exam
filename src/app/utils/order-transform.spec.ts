import type { Order } from '../models/order';
import { calculateNetTotal, formatThaiDateTime, groupOrdersByNumber } from './order-transform';

const orders: readonly Order[] = [
  { id: 2, shop: 'IT24H Star', status: 'ชำระเงินแล้ว', date: '2021-02-01', time: '10:10:12', number: 'TH202102143', item: 'Apple Magic Mouse', option: 'สีเงิน', quantity: 1, total: 2200, shipping: 30, discount: 0, net: 2230 },
  { id: 4, shop: 'Icomputer', status: 'ส่งของแล้ว', date: '2020-11-11', time: '12:28:00', number: 'TH202011091', item: 'Keyboard ไร้สาย', option: 'สีดำ', quantity: 1, total: 9190, shipping: 15, discount: 30, net: 9175 },
  { id: 5, shop: 'Icomputer', status: 'ส่งของแล้ว', date: '2020-11-11', time: '12:28:00', number: 'TH202011091', item: 'แผ่นรองเมาส์', option: 'ขนาดใหญ่', quantity: 1, total: 560, shipping: 15, discount: 0, net: 575 },
];

describe('order transformations', () => {
  it('groups matching order numbers and preserves first-seen and item order', () => {
    const groups = groupOrdersByNumber([orders[1], orders[0], orders[2]]);
    expect(groups.map(group => group.number)).toEqual(['TH202011091', 'TH202102143']);
    expect(groups[0].items.map(order => order.id)).toEqual([4, 5]);
    expect(groups[1].items.map(order => order.id)).toEqual([2]);
  });

  it('calculates net totals for each group and all rows', () => {
    expect(groupOrdersByNumber(orders).map(group => group.netTotal)).toEqual([2230, 9750]);
    expect(calculateNetTotal(orders)).toBe(11980);
  });

  it('recalculates totals without trusting net or multiplying quantity again', () => {
    expect(calculateNetTotal([{ ...orders[0], quantity: 2, net: 999 }])).toBe(2230);
  });

  it('adds decimal currency without floating point residue', () => {
    expect(calculateNetTotal([{ ...orders[0], total: 0.1, shipping: 0.2, discount: 0 }])).toBe(0.3);
  });

  it('formats Gregorian dates as Thai Buddhist dates with minutes', () => {
    expect(formatThaiDateTime('2021-02-01 10:10:12')).toBe('01/02/2564 10:10 น.');
    expect(formatThaiDateTime('2020-11-11 12:28:00')).toBe('11/11/2563 12:28 น.');
  });

  it('preserves midnight without timezone shifts and accepts a valid leap day', () => {
    expect(formatThaiDateTime('2020-02-29 00:05:59')).toBe('29/02/2563 00:05 น.');
  });

  it.each(['invalid', '2021-02-29 10:10:12', '2020-13-01 10:10:12', '2020-01-01 24:00:00'])(
    'rejects invalid date/time: %s', value => {
      expect(() => formatThaiDateTime(value)).toThrow(RangeError);
    },
  );

  it('handles empty input', () => {
    expect(groupOrdersByNumber([])).toEqual([]);
    expect(calculateNetTotal([])).toBe(0);
  });

  it('does not mutate frozen inputs and returns independent row objects', () => {
    const input = Object.freeze(orders.map(order => Object.freeze({ ...order })));
    const before = JSON.stringify(input);
    const groups = groupOrdersByNumber(input);
    calculateNetTotal(input);
    input.forEach(order => formatThaiDateTime(`${order.date} ${order.time}`));
    expect(JSON.stringify(input)).toBe(before);
    expect(groups[0].items).not.toBe(input);
    expect(groups[0].items[0]).not.toBe(input[0]);
    expect(groupOrdersByNumber(input)).toEqual(groups);
  });
});
