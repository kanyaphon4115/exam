import { ValidatorFn } from '@angular/forms';

export const supportedStatusValidator: ValidatorFn = control =>
  ['', 'ชำระเงินแล้ว', 'ส่งของแล้ว'].includes(control.value) ? null : { unsupportedStatus: true };

/** Parse DD/MM/BBBB (Buddhist Era) into the Gregorian API date. */
export function buddhistDateToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]) - 543;
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > days[month - 1]) return null;
  return `${String(year).padStart(4, '0')}-${match[2]}-${match[1]}`;
}

export const buddhistDateValidator: ValidatorFn = control =>
  !control.value || buddhistDateToIso(control.value) ? null : { buddhistDate: true };

export const dateRangeValidator: ValidatorFn = control => {
  const { dateFrom, dateTo } = control.value;
  const from = buddhistDateToIso(dateFrom ?? '');
  const to = buddhistDateToIso(dateTo ?? '');
  return from && to && from > to ? { dateRange: true } : null;
};
