import { useEffect, useState } from 'react';

/**
 * Why: search-as-you-type would otherwise fire a network request (via RTK
 * Query) on every keystroke. Debouncing the VALUE (not the callback) means
 * the input stays perfectly responsive — it's a controlled input bound to
 * the raw, undebounced state — while only the derived, debounced value
 * flows into `useInvoiceFilters` → `useInvoices` → the query cache key.
 *
 * Performance: a single `setTimeout`/cleanup per change; no dependency on
 * external libraries (lodash.debounce) for something this small.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
