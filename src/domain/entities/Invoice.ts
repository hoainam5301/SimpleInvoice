/** Status values observed from the real invoice-service sandbox. */
export type InvoiceStatus = 'Due' | 'Overdue' | 'Paid';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: InvoiceStatus;
  issueDate: string; // ISO 8601
  dueDate: string; // ISO 8601
  amount: number;
  currency: string;
  lineItem: InvoiceLineItem;
}

export interface CreateInvoiceInput {
  customerName: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItem: InvoiceLineItem;
}

/** Each value maps 1:1 to a server sortBy (see data/mappers/invoiceMapper). */
export type InvoiceSortField = 'createdDate' | 'issueDate' | 'dueDate' | 'amount';
export type SortDirection = 'asc' | 'desc';

export interface InvoiceQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: InvoiceStatus;
  sortBy?: InvoiceSortField;
  sortDirection?: SortDirection;
}
