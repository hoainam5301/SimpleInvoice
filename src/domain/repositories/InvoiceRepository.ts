import type { PaginatedResult } from '../../core/types/common.types';
import type { CreateInvoiceInput, Invoice, InvoiceQuery } from '../entities/Invoice';

export interface InvoiceRepository {
  getInvoices(query: InvoiceQuery): Promise<PaginatedResult<Invoice>>;
  createInvoice(input: CreateInvoiceInput): Promise<Invoice>;
}
