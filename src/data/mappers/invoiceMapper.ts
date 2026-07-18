import type {
  CreateInvoiceRequestDto,
  InvoiceDto,
  InvoiceListResponseDto,
} from '../dto/InvoiceDto';
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceQuery,
  InvoiceSortField,
  InvoiceStatus,
} from '../../domain/entities/Invoice';
import type { PaginatedResult } from '../../core/types/common.types';
import { INVOICE_STATUSES } from '../../core/constants/app.constants';

/**
 * The server reports status as an array of {key, value} flags; the domain
 * owns it as a closed union. The first active flag wins; anything
 * unrecognized degrades to 'Due' instead of leaking an out-of-union value
 * into UI lookups like STATUS_COLORS[status].
 */
function mapStatus(dto: InvoiceDto): InvoiceStatus {
  const active = dto.status?.find(s => s.value)?.key;
  return (INVOICE_STATUSES as readonly string[]).includes(active ?? '')
    ? (active as InvoiceStatus)
    : 'Due';
}

function mapCustomerName(dto: InvoiceDto): string {
  const c = dto.customer;
  if (!c) return 'Unknown customer';
  return c.name ?? [c.firstName, c.lastName].filter(Boolean).join(' ') ?? 'Unknown customer';
}

export function mapInvoiceDtoToEntity(dto: InvoiceDto): Invoice {
  const item = dto.items?.[0];
  return {
    id: dto.invoiceId,
    invoiceNumber: dto.invoiceNumber,
    customerName: mapCustomerName(dto),
    status: mapStatus(dto),
    issueDate: dto.invoiceDate,
    dueDate: dto.dueDate,
    amount: dto.totalAmount,
    currency: dto.currency,
    lineItem: {
      description: item?.description ?? item?.itemName ?? dto.description ?? '',
      quantity: item?.quantity ?? 1,
      unitPrice: item?.rate ?? dto.totalAmount,
    },
  };
}

export function mapInvoiceListResponseToEntity(
  dto: InvoiceListResponseDto,
): PaginatedResult<Invoice> {
  const { pageNumber, pageSize, totalRecords } = dto.paging;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalRecords / pageSize)) : 1;
  return {
    items: dto.data.map(mapInvoiceDtoToEntity),
    page: pageNumber,
    pageSize,
    totalItems: totalRecords,
    totalPages,
    hasNextPage: pageNumber < totalPages,
  };
}

/** Domain sort field → server sortBy value (validated against the sandbox). */
const SORT_BY_MAP: Record<InvoiceSortField, string> = {
  createdDate: 'CREATED_DATE',
  issueDate: 'INVOICE_DATE',
  dueDate: 'DUE_DATE',
  amount: 'TOTAL_AMOUNT',
};

/** Domain query → the invoice-service's query-param dialect. */
export function mapInvoiceQueryToParams(query: InvoiceQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    pageNum: query.page,
    pageSize: query.pageSize,
    sortBy: SORT_BY_MAP[query.sortBy ?? 'createdDate'],
    ordering: query.sortDirection === 'asc' ? 'ASCENDING' : 'DESCENDING',
  };
  if (query.search) params.keyword = query.search;
  if (query.status) params.status = query.status;
  return params;
}

export function mapCreateInvoiceInputToDto(input: CreateInvoiceInput): CreateInvoiceRequestDto {
  // The API models customers as first/last name; the app captures one
  // "customer name" field, so split on the first space.
  const [firstName, ...rest] = input.customerName.trim().split(/\s+/);
  const uniqueSuffix = Date.now();
  return {
    invoices: [
      {
        invoiceReference: `#SI${uniqueSuffix}`,
        invoiceNumber: `INV${uniqueSuffix}`,
        currency: input.currency,
        invoiceDate: input.issueDate,
        dueDate: input.dueDate,
        description: input.lineItem.description,
        customer: {
          firstName: firstName ?? input.customerName,
          lastName: rest.join(' ') || firstName || input.customerName,
        },
        items: [
          {
            itemReference: `item-${uniqueSuffix}`,
            itemName: input.lineItem.description,
            description: input.lineItem.description,
            quantity: input.lineItem.quantity,
            rate: input.lineItem.unitPrice,
          },
        ],
      },
    ],
  };
}
