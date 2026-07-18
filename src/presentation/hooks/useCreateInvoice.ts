import { useCallback } from 'react';
import { useCreateInvoiceMutation } from '../../store/api/invoiceApi.rtk';
import type { CreateInvoiceInput } from '../../domain/entities/Invoice';

/**
 * Why: wraps the RTK Query mutation hook so CreateInvoiceScreen deals in
 * domain terms (`submit(input)`, `isSubmitting`, `error`) instead of RTK
 * Query's generic `[trigger, { isLoading, error }]` tuple shape. If we ever
 * swap the caching layer (see DECISIONS.md), this is the only hook that
 * changes — the screen and its Zod schema are untouched.
 */
export function useCreateInvoice() {
  const [createInvoice, { isLoading, error, isSuccess, reset }] = useCreateInvoiceMutation();

  const submit = useCallback(
    (input: CreateInvoiceInput) => createInvoice(input).unwrap(),
    [createInvoice],
  );

  return {
    submit,
    isSubmitting: isLoading,
    error: error as string | undefined,
    isSuccess,
    reset,
  };
}
