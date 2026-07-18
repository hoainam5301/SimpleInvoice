import { act, renderHook } from '@testing-library/react-native';
import { useInvoiceFilters } from '../../../src/presentation/hooks/useInvoiceFilters';

describe('useInvoiceFilters', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('exposes sensible defaults', () => {
    const { result } = renderHook(() => useInvoiceFilters());
    expect(result.current.search).toBe('');
    expect(result.current.status).toBeUndefined();
    expect(result.current.sortBy).toBe('createdDate');
    expect(result.current.sortDirection).toBe('desc');
  });

  it('updates raw search immediately but only debounces into filters', () => {
    const { result } = renderHook(() => useInvoiceFilters());

    act(() => result.current.setSearch('acme'));
    // Raw value is synchronous; the debounced filters.search lags behind.
    expect(result.current.search).toBe('acme');
    expect(result.current.filters.search).toBe('');

    act(() => jest.advanceTimersByTime(400));
    expect(result.current.filters.search).toBe('acme');
  });

  it('toggles sort direction when the same field is selected twice', () => {
    const { result } = renderHook(() => useInvoiceFilters());

    act(() => result.current.setSort('amount'));
    expect(result.current.sortBy).toBe('amount');
    expect(result.current.sortDirection).toBe('desc');

    act(() => result.current.setSort('amount'));
    expect(result.current.sortDirection).toBe('asc');
  });

  it('resets to desc when switching to a different sort field', () => {
    const { result } = renderHook(() => useInvoiceFilters());

    act(() => result.current.setSort('amount'));
    act(() => result.current.setSort('amount')); // now asc
    act(() => result.current.setSort('dueDate'));

    expect(result.current.sortBy).toBe('dueDate');
    expect(result.current.sortDirection).toBe('desc');
  });

  it('reset restores every field to its default', () => {
    const { result } = renderHook(() => useInvoiceFilters());

    act(() => {
      result.current.setSearch('x');
      result.current.setStatus('Paid');
      result.current.setSort('amount');
    });
    act(() => result.current.reset());

    expect(result.current.search).toBe('');
    expect(result.current.status).toBeUndefined();
    expect(result.current.sortBy).toBe('createdDate');
    expect(result.current.sortDirection).toBe('desc');
  });
});
