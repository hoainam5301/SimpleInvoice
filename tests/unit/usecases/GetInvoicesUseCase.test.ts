import { GetInvoicesUseCase } from '../../../src/domain/usecases/invoice/GetInvoicesUseCase';
import type { InvoiceRepository } from '../../../src/domain/repositories/InvoiceRepository';
import type { InvoiceQuery } from '../../../src/domain/entities/Invoice';
import type { PaginatedResult } from '../../../src/core/types/common.types';
import type { Invoice } from '../../../src/domain/entities/Invoice';

const emptyPage: PaginatedResult<Invoice> = {
  items: [],
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
};

function makeRepo(): jest.Mocked<InvoiceRepository> {
  return {
    getInvoices: jest.fn().mockResolvedValue(emptyPage),
    createInvoice: jest.fn(),
  };
}

function lastQuery(repo: jest.Mocked<InvoiceRepository>): InvoiceQuery {
  return repo.getInvoices.mock.calls[0]![0];
}

describe('GetInvoicesUseCase — query guards', () => {
  it('clamps page to a minimum of 1', async () => {
    const repo = makeRepo();
    await new GetInvoicesUseCase(repo).execute({ page: 0, pageSize: 20 });
    expect(lastQuery(repo).page).toBe(1);
  });

  it('clamps pageSize into the 1..100 range', async () => {
    const repo = makeRepo();
    await new GetInvoicesUseCase(repo).execute({ page: 1, pageSize: 5000 });
    expect(lastQuery(repo).pageSize).toBe(100);

    const repo2 = makeRepo();
    await new GetInvoicesUseCase(repo2).execute({ page: 1, pageSize: 0 });
    expect(lastQuery(repo2).pageSize).toBe(1);
  });

  it('trims whitespace-only search down to undefined', async () => {
    const repo = makeRepo();
    await new GetInvoicesUseCase(repo).execute({ page: 1, pageSize: 20, search: '   ' });
    expect(lastQuery(repo).search).toBeUndefined();
  });

  it('trims a real search term and preserves other filters', async () => {
    const repo = makeRepo();
    await new GetInvoicesUseCase(repo).execute({
      page: 2,
      pageSize: 20,
      search: '  INV-1 ',
      status: 'Paid',
      sortBy: 'amount',
      sortDirection: 'asc',
    });
    const q = lastQuery(repo);
    expect(q.search).toBe('INV-1');
    expect(q.status).toBe('Paid');
    expect(q.sortBy).toBe('amount');
    expect(q.sortDirection).toBe('asc');
  });

  it('returns the repository result unchanged', async () => {
    const repo = makeRepo();
    const result = await new GetInvoicesUseCase(repo).execute({ page: 1, pageSize: 20 });
    expect(result).toBe(emptyPage);
  });
});
