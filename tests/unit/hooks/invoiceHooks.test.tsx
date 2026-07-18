import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useInvoices } from '../../../src/presentation/hooks/useInvoices';
import { useCreateInvoice } from '../../../src/presentation/hooks/useCreateInvoice';
import { makeWrapper } from '../../utils/testStore';
import { container } from '../../../src/app/di/container';
import type { Invoice } from '../../../src/domain/entities/Invoice';
import type { PaginatedResult } from '../../../src/core/types/common.types';

jest.mock('../../../src/app/di/container', () => ({
  container: {
    useCases: {
      login: { execute: jest.fn() },
      logout: { execute: jest.fn() },
      restoreSession: { execute: jest.fn() },
      getInvoices: { execute: jest.fn() },
      createInvoice: { execute: jest.fn() },
    },
  },
}));

const mockedUseCases = container.useCases as unknown as {
  getInvoices: { execute: jest.Mock };
  createInvoice: { execute: jest.Mock };
};

function inv(id: string): Invoice {
  return {
    id,
    invoiceNumber: `INV-${id}`,
    customerName: 'Acme',
    status: 'Due',
    issueDate: '2026-07-01',
    dueDate: '2026-07-15',
    amount: 100,
    currency: 'USD',
    lineItem: { description: 'x', quantity: 1, unitPrice: 100 },
  };
}

function pageOf(items: Invoice[], page: number, totalPages: number): PaginatedResult<Invoice> {
  return { items, page, pageSize: 20, totalItems: totalPages * 20, totalPages, hasNextPage: page < totalPages };
}

const filters = { search: '', status: undefined, sortBy: 'createdDate', sortDirection: 'desc' } as const;

beforeEach(() => jest.clearAllMocks());

describe('useInvoices', () => {
  it('loads the first page and exposes the accumulated list', async () => {
    mockedUseCases.getInvoices.execute.mockResolvedValue(pageOf([inv('1'), inv('2')], 1, 1));
    const { result } = renderHook(() => useInvoices({ filters }), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.invoices).toHaveLength(2));
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.invoices.map(i => i.id)).toEqual(['1', '2']);
  });

  it('accumulates the next page and de-dupes ids that overlap between pages', async () => {
    mockedUseCases.getInvoices.execute.mockImplementation(async (q: { page: number }) =>
      q.page === 1 ? pageOf([inv('1'), inv('2')], 1, 2) : pageOf([inv('2'), inv('3')], 2, 2),
    );
    const { result } = renderHook(() => useInvoices({ filters }), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.invoices).toHaveLength(2));

    act(() => result.current.loadMore());

    // inv('2') appears in both pages but must not be duplicated.
    await waitFor(() => expect(result.current.invoices.map(i => i.id)).toEqual(['1', '2', '3']));
  });

  it('surfaces the query error', async () => {
    mockedUseCases.getInvoices.execute.mockRejectedValue(
      Object.assign(new Error('down'), { name: 'ApiError' }),
    );
    const { result } = renderHook(() => useInvoices({ filters }), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});

describe('useCreateInvoice', () => {
  const input = {
    customerName: 'Acme',
    issueDate: '2026-07-01',
    dueDate: '2026-07-15',
    currency: 'USD',
    lineItem: { description: 'x', quantity: 1, unitPrice: 100 },
  };

  it('submit resolves with the created invoice and flips isSuccess', async () => {
    mockedUseCases.createInvoice.execute.mockResolvedValue(inv('9'));
    const { result } = renderHook(() => useCreateInvoice(), { wrapper: makeWrapper() });

    await act(async () => {
      const created = await result.current.submit(input);
      expect(created.id).toBe('9');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('submit rejects when the use case fails', async () => {
    mockedUseCases.createInvoice.execute.mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useCreateInvoice(), { wrapper: makeWrapper() });

    await act(async () => {
      await expect(result.current.submit(input)).rejects.toBeDefined();
    });
  });
});
