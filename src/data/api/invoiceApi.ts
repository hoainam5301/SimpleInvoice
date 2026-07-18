import { httpClient } from '../../core/network/httpClient';
import { API_ENDPOINTS } from '../../core/constants/api.constants';
import type {
  CreateInvoiceRequestDto,
  CreateInvoiceResponseDto,
  InvoiceDto,
  InvoiceListResponseDto,
} from '../dto/InvoiceDto';
import type { InvoiceQuery } from '../../domain/entities/Invoice';
import { mapInvoiceQueryToParams } from '../mappers/invoiceMapper';
import { ApiError, ApiErrorType } from '../../core/network/apiError';

export const invoiceApi = {
  async list(query: InvoiceQuery): Promise<InvoiceListResponseDto> {
    const response = await httpClient.get<InvoiceListResponseDto>(API_ENDPOINTS.INVOICES, {
      params: mapInvoiceQueryToParams(query),
    });
    return response.data;
  },

  async create(payload: CreateInvoiceRequestDto): Promise<InvoiceDto> {
    const response = await httpClient.post<CreateInvoiceResponseDto>(
      API_ENDPOINTS.INVOICES,
      payload,
      // SYNC makes the server create the invoice inline and return it in
      // the response body (per the assessment API spec) instead of queueing.
      { headers: { 'Operation-Mode': 'SYNC' } },
    );
    const created = response.data.data?.[0];
    if (!created) {
      throw new ApiError({
        type: ApiErrorType.UNKNOWN,
        message: 'The server did not return the created invoice.',
      });
    }
    return created;
  },
};
