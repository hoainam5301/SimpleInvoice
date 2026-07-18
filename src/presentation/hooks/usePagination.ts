import { useCallback, useMemo, useState } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

interface UsePaginationResult {
  page: number;
  pageSize: number;
  nextPage: () => void;
  reset: () => void;
  setTotalPages: (totalPages: number) => void;
  canLoadMore: boolean;
}

/**
 * Why: pagination bookkeeping (current page, whether another page exists,
 * resetting to page 1 when a filter changes) is identical across any
 * future paginated list in the app — extracting it once avoids every
 * screen reinventing page-clamping logic.
 *
 * This hook owns ONLY page/pageSize state, not data fetching — `useInvoices`
 * composes it with `useGetInvoicesQuery` so the pagination primitive stays
 * reusable for lists that aren't invoices.
 *
 * Performance: `nextPage`/`reset` are memoized with `useCallback` so they
 * stay referentially stable across renders — safe to pass as a FlatList
 * `onEndReached` prop without retriggering effects.
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
  const { initialPage = 1, pageSize = 20 } = options;
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPagesState] = useState<number | null>(null);

  const nextPage = useCallback(() => {
    setPage(current => {
      if (totalPages !== null && current >= totalPages) return current;
      return current + 1;
    });
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setTotalPagesState(null);
  }, [initialPage]);

  const setTotalPages = useCallback((value: number) => {
    setTotalPagesState(value);
  }, []);

  const canLoadMore = useMemo(
    () => totalPages === null || page < totalPages,
    [page, totalPages],
  );

  return { page, pageSize, nextPage, reset, setTotalPages, canLoadMore };
}
