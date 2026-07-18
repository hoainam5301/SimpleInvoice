import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from './useDebounce';
import { DEBOUNCE_SEARCH_MS } from '../../core/constants/app.constants';
import type { InvoiceSortField, InvoiceStatus, SortDirection } from '../../domain/entities/Invoice';

interface FiltersState {
  search: string;
  status: InvoiceStatus | undefined;
  sortBy: InvoiceSortField;
  sortDirection: SortDirection;
}

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  status: undefined,
  sortBy: 'createdDate',
  sortDirection: 'desc',
};

/**
 * Why: search input, status filter, and sort selection are three pieces of
 * UI state that always change together from the invoice list's point of
 * view (any one of them means "start over from page 1"). Bundling them in
 * one hook — rather than three `useState`s in the screen — gives the
 * screen a single `filters` object to pass to `useInvoices` and a single
 * `resetToken` it can watch to reset pagination.
 *
 * Performance: only `debouncedSearch` (not raw `search`) is exposed in
 * `filters`, so `useGetInvoicesQuery`'s cache key — and therefore the
 * network request — only changes 400ms after the user stops typing, not on
 * every keystroke. The text input itself stays bound to `search` (updated
 * synchronously) so there is zero input lag.
 */
export function useInvoiceFilters() {
  const [search, setSearch] = useState(DEFAULT_FILTERS.search);
  const [status, setStatus] = useState(DEFAULT_FILTERS.status);
  const [sortBy, setSortBy] = useState(DEFAULT_FILTERS.sortBy);
  const [sortDirection, setSortDirection] = useState(DEFAULT_FILTERS.sortDirection);

  const debouncedSearch = useDebounce(search, DEBOUNCE_SEARCH_MS);

  const setSort = useCallback(
    (field: InvoiceSortField) => {
      setSortDirection(prevDirection =>
        field === sortBy ? (prevDirection === 'asc' ? 'desc' : 'asc') : 'desc',
      );
      setSortBy(field);
    },
    [sortBy],
  );

  const reset = useCallback(() => {
    setSearch(DEFAULT_FILTERS.search);
    setStatus(DEFAULT_FILTERS.status);
    setSortBy(DEFAULT_FILTERS.sortBy);
    setSortDirection(DEFAULT_FILTERS.sortDirection);
  }, []);

  const filters = useMemo(
    () => ({ search: debouncedSearch, status, sortBy, sortDirection }),
    [debouncedSearch, status, sortBy, sortDirection],
  );

  return {
    // raw, synchronous — bind directly to the search TextInput
    search,
    setSearch,
    status,
    setStatus,
    sortBy,
    sortDirection,
    setSort,
    reset,
    // debounced, memoized — pass to useInvoices
    filters,
  };
}
