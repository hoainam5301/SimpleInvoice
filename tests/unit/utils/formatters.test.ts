import { formatCurrency, formatDate } from '../../../src/core/utils/formatters';

describe('formatCurrency', () => {
  it('formats with the default USD currency', () => {
    expect(formatCurrency(1999)).toBe('$1,999.00');
  });

  it('formats with an explicit currency', () => {
    // Intl output includes the currency code for non-symbol currencies.
    expect(formatCurrency(123, 'LKR')).toContain('123');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date', () => {
    expect(formatDate('2026-07-18')).toBe('Jul 18, 2026');
  });

  it('returns the raw input when the date is unparseable', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});
