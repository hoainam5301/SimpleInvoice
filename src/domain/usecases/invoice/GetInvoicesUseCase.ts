import type { InvoiceRepository } from '../../repositories/InvoiceRepository';
import type { Invoice, InvoiceQuery } from '../../entities/Invoice';
import type { PaginatedResult } from '../../../core/types/common.types';

const MAX_PAGE_SIZE = 100;

/**
 * Normalizes/guards query params before they hit the network — e.g. clamps
 * an out-of-range page size instead of letting a UI bug fan out into an
 * expensive backend query. Query building (turning `InvoiceQuery` into
 * axios params) stays in the Data layer; this is a business-rule guard,
 * not a serialization detail.
 */
export class GetInvoicesUseCase {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(query: InvoiceQuery): Promise<PaginatedResult<Invoice>> {
    const safeQuery: InvoiceQuery = {
      ...query,
      page: Math.max(1, query.page),
      pageSize: Math.min(Math.max(1, query.pageSize), MAX_PAGE_SIZE),
      search: query.search?.trim() || undefined,
    };

    return this.invoiceRepository.getInvoices(safeQuery);
  }
}
