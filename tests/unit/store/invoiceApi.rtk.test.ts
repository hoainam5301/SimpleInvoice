import { invoiceApi } from '../../../src/store/api/invoiceApi.rtk';
import { makeTestStore } from '../../utils/testStore';
import { container } from '../../../src/app/di/container';
import { ApiError, ApiErrorType } from '../../../src/core/network/apiError';
import type { Invoice, InvoiceQuery } from '../../../src/domain/entities/Invoice';
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

const invoice: Invoice = {
  id: 'inv_1',
  invoiceNumber: 'INV-001',
  customerName: 'Acme Corp',
  status: 'Due',
  issueDate: '2026-07-01',
  dueDate: '2026-07-15',
  amount: 300,
  currency: 'USD',
  lineItem: { description: 'Consulting', quantity: 2, unitPrice: 150 },
};

const page: PaginatedResult<Invoice> = {
  items: [invoice],
  page: 1,
  pageSize: 20,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
};

const query: InvoiceQuery = { page: 1, pageSize: 20 };

beforeEach(() => jest.clearAllMocks());

describe('invoiceApi getInvoices', () => {
  it('returns the use case result as query data', async () => {
    mockedUseCases.getInvoices.execute.mockResolvedValue(page);
    const store = makeTestStore();

    const result = await store.dispatch(invoiceApi.endpoints.getInvoices.initiate(query));

    expect(mockedUseCases.getInvoices.execute).toHaveBeenCalledWith(query);
    expect(result.data).toEqual(page);
  });

  it('surfaces an ApiError message as the query error', async () => {
    mockedUseCases.getInvoices.execute.mockRejectedValue(
      new ApiError({ type: ApiErrorType.SERVER, message: 'Server exploded' }),
    );
    const store = makeTestStore();

    const result = await store.dispatch(invoiceApi.endpoints.getInvoices.initiate(query));

    expect(result.error).toBe('Server exploded');
  });

  it('falls back to a generic message for non-ApiError failures', async () => {
    mockedUseCases.getInvoices.execute.mockRejectedValue(new Error('boom'));
    const store = makeTestStore();

    const result = await store.dispatch(invoiceApi.endpoints.getInvoices.initiate(query));

    expect(result.error).toBe('Failed to load invoices.');
  });
});

describe('invoiceApi createInvoice', () => {
  const input = {
    customerName: 'Acme Corp',
    issueDate: '2026-07-01',
    dueDate: '2026-07-15',
    currency: 'USD',
    lineItem: { description: 'Consulting', quantity: 2, unitPrice: 150 },
  };

  it('returns the created invoice on success', async () => {
    mockedUseCases.createInvoice.execute.mockResolvedValue(invoice);
    const store = makeTestStore();

    const result = await store.dispatch(invoiceApi.endpoints.createInvoice.initiate(input));

    expect(mockedUseCases.createInvoice.execute).toHaveBeenCalledWith(input);
    expect('data' in result && result.data).toEqual(invoice);
  });

  it('falls back to a generic message when creation fails without an ApiError', async () => {
    mockedUseCases.createInvoice.execute.mockRejectedValue(new Error('nope'));
    const store = makeTestStore();

    const result = await store.dispatch(invoiceApi.endpoints.createInvoice.initiate(input));

    expect('error' in result && result.error).toBe('Failed to create invoice.');
  });
});
