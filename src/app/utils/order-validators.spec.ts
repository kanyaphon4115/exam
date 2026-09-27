import { buddhistDateToIso } from './order-validators';

describe('Buddhist Era date conversion', () => {
  it('converts Thai display dates to Gregorian API dates', () => {
    expect(buddhistDateToIso('01/02/2564')).toBe('2021-02-01');
    expect(buddhistDateToIso('27/09/2569')).toBe('2026-09-27');
    expect(buddhistDateToIso(' 01/01/2563 ')).toBe('2020-01-01');
  });

  it('validates leap days using the Gregorian year', () => {
    expect(buddhistDateToIso('29/02/2563')).toBe('2020-02-29');
    expect(buddhistDateToIso('29/02/2564')).toBeNull();
    expect(buddhistDateToIso('29/02/2543')).toBe('2000-02-29');
    expect(buddhistDateToIso('29/02/2443')).toBeNull();
  });

  it('rejects impossible dates, incomplete input and the old ISO format', () => {
    for (const value of ['', '31/04/2569', '00/01/2569', '01/13/2569', '01/02/25', '2026-09-27', '01/01/0000']) {
      expect(buddhistDateToIso(value)).toBeNull();
    }
  });
});
