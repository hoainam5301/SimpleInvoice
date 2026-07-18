import {
  mapInvoiceDtoToEntity,
  mapInvoiceListResponseToEntity,
  mapInvoiceQueryToParams,
  mapCreateInvoiceInputToDto,
} from '../../../src/data/mappers/invoiceMapper';
import type { InvoiceDto } from '../../../src/data/dto/InvoiceDto';

function baseDto(overrides: Partial<InvoiceDto> = {}): InvoiceDto {
  return {
    invoiceId: 'id_1',
    invoiceNumber: 'INV-1',
    currency: 'USD',
    invoiceDate: '2026-07-01',
    dueDate: '2026-07-15',
    totalAmount: 500,
    ...overrides,
  };
}

describe('mapInvoiceDtoToEntity — status', () => {
  it('picks the first active status flag', () => {
    const dto = baseDto({
      status: [
        { key: 'Overdue', value: false },
        { key: 'Paid', value: true },
      ],
    });
    expect(mapInvoiceDtoToEntity(dto).status).toBe('Paid');
  });

  it('degrades an unrecognized active status to "Due"', () => {
    const dto = baseDto({ status: [{ key: 'Weird', value: true }] });
    expect(mapInvoiceDtoToEntity(dto).status).toBe('Due');
  });

  it('degrades to "Due" when there is no status array', () => {
    expect(mapInvoiceDtoToEntity(baseDto()).status).toBe('Due');
  });
});

describe('mapInvoiceDtoToEntity — customer name & line item', () => {
  it('prefers customer.name', () => {
    const dto = baseDto({ customer: { name: 'Acme Ltd', firstName: 'A', lastName: 'B' } });
    expect(mapInvoiceDtoToEntity(dto).customerName).toBe('Acme Ltd');
  });

  it('falls back to first + last name', () => {
    const dto = baseDto({ customer: { firstName: 'Jane', lastName: 'Doe' } });
    expect(mapInvoiceDtoToEntity(dto).customerName).toBe('Jane Doe');
  });

  it('uses "Unknown customer" when no customer is present', () => {
    expect(mapInvoiceDtoToEntity(baseDto()).customerName).toBe('Unknown customer');
  });

  it('derives the line item from the first item, with fallbacks', () => {
    const dto = baseDto({
      items: [{ itemName: 'Widget', quantity: 3, rate: 40 }],
    });
    const li = mapInvoiceDtoToEntity(dto).lineItem;
    expect(li).toEqual({ description: 'Widget', quantity: 3, unitPrice: 40 });
  });

  it('falls back to invoice-level totals when there is no item', () => {
    const dto = baseDto({ description: 'Flat fee', totalAmount: 500 });
    const li = mapInvoiceDtoToEntity(dto).lineItem;
    expect(li).toEqual({ description: 'Flat fee', quantity: 1, unitPrice: 500 });
  });
});

describe('mapInvoiceListResponseToEntity', () => {
  it('computes totalPages and hasNextPage', () => {
    const result = mapInvoiceListResponseToEntity({
      data: [baseDto()],
      paging: { pageNumber: 1, pageSize: 10, totalRecords: 25 },
    });
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
    expect(result.items).toHaveLength(1);
  });

  it('guards against a zero page size', () => {
    const result = mapInvoiceListResponseToEntity({
      data: [],
      paging: { pageNumber: 1, pageSize: 0, totalRecords: 0 },
    });
    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
  });
});

describe('mapInvoiceQueryToParams', () => {
  it('translates domain sort/direction into the server dialect and defaults', () => {
    const params = mapInvoiceQueryToParams({ page: 2, pageSize: 20 });
    expect(params).toMatchObject({
      pageNum: 2,
      pageSize: 20,
      sortBy: 'CREATED_DATE',
      ordering: 'DESCENDING',
    });
    expect(params.keyword).toBeUndefined();
    expect(params.status).toBeUndefined();
  });

  it('maps each sort field and ascending order, and includes search/status', () => {
    const params = mapInvoiceQueryToParams({
      page: 1,
      pageSize: 20,
      sortBy: 'amount',
      sortDirection: 'asc',
      search: 'INV-1',
      status: 'Paid',
    });
    expect(params.sortBy).toBe('TOTAL_AMOUNT');
    expect(params.ordering).toBe('ASCENDING');
    expect(params.keyword).toBe('INV-1');
    expect(params.status).toBe('Paid');
  });
});

describe('mapCreateInvoiceInputToDto', () => {
  const input = {
    customerName: 'Jane Doe',
    issueDate: '2026-07-01',
    dueDate: '2026-07-15',
    currency: 'USD',
    lineItem: { description: 'Consulting', quantity: 2, unitPrice: 150 },
  };

  it('splits the customer name and wraps a single invoice in a batch array', () => {
    const dto = mapCreateInvoiceInputToDto(input);
    expect(dto.invoices).toHaveLength(1);
    expect(dto.invoices[0]!.customer).toEqual({ firstName: 'Jane', lastName: 'Doe' });
    expect(dto.invoices[0]!.items).toHaveLength(1);
    expect(dto.invoices[0]!.items[0]).toMatchObject({ quantity: 2, rate: 150 });
  });

  it('handles a single-word customer name by reusing it for last name', () => {
    const dto = mapCreateInvoiceInputToDto({ ...input, customerName: 'Acme' });
    expect(dto.invoices[0]!.customer).toEqual({ firstName: 'Acme', lastName: 'Acme' });
  });
});
