import { useEffect, useMemo, useRef, useState } from 'react';
import { useGetInvoicesQuery } from '../../store/api/invoiceApi.rtk';
import { usePagination } from './usePagination';
import { DEFAULT_PAGE_SIZE } from '../../core/constants/api.constants';
import type { Invoice, InvoiceQuery } from '../../domain/entities/Invoice';

interface UseInvoicesParams {
  filters: Pick<InvoiceQuery, 'search' | 'status' | 'sortBy' | 'sortDirection'>;
}

/**
 * Why: this is the ONLY place that turns (filters + pagination) into the
 * accumulated list a `FlatList` renders. It composes three smaller
 * concerns — `useInvoiceFilters` (owned by the screen), `usePagination`
 * (page bookkeeping), and `useGetInvoicesQuery` (server cache) — instead of
 * InvoiceListScreen juggling all three directly. Screens call exactly one
 * hook and get back `{ invoices, loadMore, isLoading, ... }`.
 *
 * Performance:
 *  - RTK Query caches each `(page, filters)` combination independently, so
 *    paging back to an already-seen page is instant and makes no network
 *    call.
 *  - Changing `filters` resets to page 1 and clears the accumulated list —
 *    otherwise page 2 results from the OLD filter would render alongside
 *    page 1 results from the NEW filter.
 *  - Accumulation happens in a `ref`-backed effect, not on every render, so
 *    re-renders from unrelated state changes don't reprocess the list.
 */
export function useInvoices({ filters }: UseInvoicesParams) {
  const { page, pageSize, nextPage, reset, setTotalPages, canLoadMore } = usePagination({
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [accumulated, setAccumulated] = useState<Invoice[]>([]);
  const filtersKey = JSON.stringify(filters);
  const previousFiltersKey = useRef(filtersKey);

  useEffect(() => {
    if (previousFiltersKey.current !== filtersKey) {
      previousFiltersKey.current = filtersKey;
      setAccumulated([]);
      reset();
    }
    // reset() is stable (useCallback) and intentionally excluded to avoid
    // re-running this on every pagination change, only on filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const query: InvoiceQuery = useMemo(
    () => ({ page, pageSize, ...filters }),
    [page, pageSize, filters],
  );

  const { data, isFetching, isLoading, error, refetch } = useGetInvoicesQuery(query);

  useEffect(() => {
    if (!data) return;
    setTotalPages(data.totalPages);
    // Dedupe by id: the live backend occasionally returns the same invoice
    // on consecutive pages (data shifts between page fetches), and duplicate
    // keys crash FlatList's reconciliation assumptions.
    setAccumulated(prev => {
      const merged = page === 1 ? data.items : [...prev, ...data.items];
      const seen = new Set<string>();
      return merged.filter(inv => (seen.has(inv.id) ? false : (seen.add(inv.id), true)));
    });
  }, [data, page, setTotalPages]);

  const loadMore = () => {
    if (!isFetching && canLoadMore) {
      nextPage();
    }
  };

  return {
    invoices: accumulated,
    isInitialLoading: isLoading && page === 1,
    isFetchingMore: isFetching && page > 1,
    error: error as string | undefined,
    loadMore,
    refresh: () => {
      setAccumulated([]);
      reset();
      refetch();
    },
  };
}
