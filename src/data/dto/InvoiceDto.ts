/**
 * Wire shapes of the real invoice-service 1.0.0 API (verified against the
 * dev sandbox — see scripts/api-inspect.js). Only fields the app consumes
 * are declared; the server returns many more, which are ignored.
 */

export interface InvoiceStatusEntryDto {
  key: string;
  value: boolean;
}

export interface InvoiceItemDto {
  itemReference?: string;
  itemName?: string;
  description?: string;
  quantity: number;
  rate: number;
  amount?: number;
}

export interface InvoiceCustomerDto {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

export interface InvoiceDto {
  invoiceId: string;
  invoiceNumber: string;
  customer?: InvoiceCustomerDto;
  description?: string;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  status?: InvoiceStatusEntryDto[];
  items?: InvoiceItemDto[];
  createdAt?: string;
}

export interface InvoiceListResponseDto {
  data: InvoiceDto[];
  paging: {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
  };
}

/** POST /invoices — the server expects a batch wrapper even for one invoice. */
export interface CreateInvoiceRequestDto {
  invoices: Array<{
    invoiceReference: string;
    invoiceNumber: string;
    currency: string;
    invoiceDate: string;
    dueDate: string;
    description?: string;
    customer: { firstName: string; lastName: string };
    items: Array<{
      itemReference: string;
      itemName: string;
      description: string;
      quantity: number;
      rate: number;
    }>;
  }>;
}

export interface CreateInvoiceResponseDto {
  data: InvoiceDto[];
}
