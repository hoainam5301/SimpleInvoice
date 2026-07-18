import type { InvoiceRepository } from '../../domain/repositories/InvoiceRepository';
import type { CreateInvoiceInput, Invoice, InvoiceQuery } from '../../domain/entities/Invoice';
import type { PaginatedResult } from '../../core/types/common.types';
import { invoiceApi } from '../api/invoiceApi';
import {
  mapCreateInvoiceInputToDto,
  mapInvoiceDtoToEntity,
  mapInvoiceListResponseToEntity,
} from '../mappers/invoiceMapper';

export class InvoiceRepositoryImpl implements InvoiceRepository {
  async getInvoices(query: InvoiceQuery): Promise<PaginatedResult<Invoice>> {
    const response = await invoiceApi.list(query);
    return mapInvoiceListResponseToEntity(response);
  }

  async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    const dto = await invoiceApi.create(mapCreateInvoiceInputToDto(input));
    return mapInvoiceDtoToEntity(dto);
  }
}
