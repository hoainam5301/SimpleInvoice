import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { container } from '../../app/di/container';
import type { CreateInvoiceInput, Invoice, InvoiceQuery } from '../../domain/entities/Invoice';
import type { PaginatedResult } from '../../core/types/common.types';
import { ApiError } from '../../core/network/apiError';

/**
 * RTK Query gives us request de-duplication, cache-by-args, background
 * refetch, and loading/error flags "for free" — reimplementing that by hand
 * on top of plain thunks is exactly the kind of undifferentiated plumbing
 * RTK Query exists to remove (see DECISIONS.md for the Redux Toolkit vs.
 * RTK Query split).
 *
 * IMPORTANT: this still honors Clean Architecture. We do NOT use
 * `fetchBaseQuery` (which would call `fetch`/axios directly from the store
 * layer, bypassing UseCase → Repository). Instead every endpoint's
 * `queryFn` calls into `container.useCases.*` — RTK Query is used purely as
 * a caching layer in front of the same Screen → Hook → UseCase → Repository
 * → API Service chain used everywhere else. `fakeBaseQuery` disables the
 * unused default HTTP path entirely, so this constraint is structural, not
 * just a convention.
 */
export const invoiceApi = createApi({
  reducerPath: 'invoiceApi',
  baseQuery: fakeBaseQuery<string>(),
  tagTypes: ['Invoice'],
  endpoints: builder => ({
    getInvoices: builder.query<PaginatedResult<Invoice>, InvoiceQuery>({
      async queryFn(query) {
        try {
          const result = await container.useCases.getInvoices.execute(query);
          return { data: result };
        } catch (error) {
          return { error: error instanceof ApiError ? error.message : 'Failed to load invoices.' };
        }
      },
      // Cache key already covers page/search/filter/sort via `query`; tag
      // every result page as 'Invoice' so a create-invoice mutation can
      // invalidate and refetch the currently visible page(s).
      providesTags: ['Invoice'],
    }),
    createInvoice: builder.mutation<Invoice, CreateInvoiceInput>({
      async queryFn(input) {
        try {
          const result = await container.useCases.createInvoice.execute(input);
          return { data: result };
        } catch (error) {
          return { error: error instanceof ApiError ? error.message : 'Failed to create invoice.' };
        }
      },
      invalidatesTags: ['Invoice'],
    }),
  }),
});

export const { useGetInvoicesQuery, useCreateInvoiceMutation } = invoiceApi;
