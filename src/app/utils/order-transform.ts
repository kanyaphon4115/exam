import type { Order, OrderGroup } from '../models/order.model';

/** Sum line subtotals + shipping - discounts, using integer satang arithmetic.
 * Shipping and discounts belong to each row, as in the supplied mock data.
 * `total` already includes quantity, so quantity must not be multiplied again.
 */
export function calculateNetTotal(orders: readonly Order[]): number {
  const satang = orders.reduce(
    (sum, order) => sum + Math.round(order.total * 100)
      + Math.round(order.shipping * 100) - Math.round(order.discount * 100),
    0,
  );
  return satang / 100;
}

/** Preserve first-seen group/item order and copy rows to avoid input aliases. */
export function groupOrdersByNumber(orders: readonly Order[]): readonly OrderGroup[] {
  const numbers = [...new Set(orders.map(order => order.number))];
  return numbers.map((number): OrderGroup => {
    const items = orders.filter(order => order.number === number).map(order => ({ ...order }));
    return { number, items, netTotal: calculateNetTotal(items) };
  });
}

/** Format YYYY-MM-DD HH:mm:ss as DD/MM/BBBB HH:mm น. without timezone conversion.
 * Reject malformed or impossible dates instead of silently normalizing them.
 */
export function formatThaiDateTime(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new RangeError('Expected YYYY-MM-DD HH:mm:ss');

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysPerMonth[month - 1]
      || Number(hourText) > 23 || Number(minuteText) > 59 || Number(secondText) > 59) {
    throw new RangeError('Invalid date or time');
  }
  return `${dayText}/${monthText}/${year + 543} ${hourText}:${minuteText} น.`;
}
