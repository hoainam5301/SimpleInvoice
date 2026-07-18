import MockAdapter from 'axios-mock-adapter';
import * as Keychain from 'react-native-keychain';
import { httpClient } from '../../src/core/network/httpClient';
import { InvoiceRepositoryImpl } from '../../src/data/repositories/InvoiceRepositoryImpl';
import { API_ENDPOINTS } from '../../src/core/constants/api.constants';
import { ApiError, ApiErrorType } from '../../src/core/network/apiError';
import { tokenStorage } from '../../src/core/storage/tokenStorage';

/**
 * jest.setup.js's global Keychain mock is stateless (getGenericPassword
 * always resolves `false`), which is fine for tests that never read tokens
 * back. This suite exercises the auth-header-injection path end to end, so
 * it needs a mock that actually round-trips what `tokenStorage.save`
 * writes — hence the small in-memory override below, scoped to this file.
 */
let storedCredential: { username: string; password: string } | false = false;
(Keychain.setGenericPassword as jest.Mock).mockImplementation(
  async (username: string, password: string) => {
    storedCredential = { username, password };
    return true;
  },
);
(Keychain.getGenericPassword as jest.Mock).mockImplementation(async () => storedCredential);
(Keychain.resetGenericPassword as jest.Mock).mockImplementation(async () => {
  storedCredential = false;
  return true;
});

/**
 * Exercises the real Data-layer chain — InvoiceRepositoryImpl -> invoiceApi
 * -> httpClient -> interceptors -> mapper — against a mocked HTTP layer
 * (no real network call), so we're verifying wiring (query param
 * serialization, snake_case -> camelCase mapping, error translation) that
 * unit tests mocking the repository directly would never catch.
 */
describe('Invoice API integration', () => {
  const mock = new MockAdapter(httpClient);
  const repository = new InvoiceRepositoryImpl();

  beforeEach(async () => {
    mock.reset();
    await tokenStorage.save({ accessToken: 'access-123', orgToken: 'org-456' });
  });

  afterAll(() => {
    mock.restore();
  });

  const emptyList = { data: [], paging: { pageNumber: 1, pageSize: 20, totalRecords: 0 } };

  it('fetches a page of invoices and maps the response to domain entities', async () => {
    mock.onGet(API_ENDPOINTS.INVOICES).reply(200, {
      data: [
        {
          invoiceId: 'inv_1',
          invoiceNumber: 'INV-001',
          customer: { firstName: 'Acme', lastName: 'Corp' },
          status: [{ key: 'Paid', value: true }],
          invoiceDate: '2026-06-01',
          dueDate: '2026-06-15',
          totalAmount: 500,
          currency: 'USD',
          items: [{ description: 'Design work', quantity: 1, rate: 500 }],
        },
      ],
      paging: { pageNumber: 1, pageSize: 20, totalRecords: 1 },
    });

    const result = await repository.getInvoices({ page: 1, pageSize: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'inv_1',
      invoiceNumber: 'INV-001',
      customerName: 'Acme Corp',
      status: 'Paid',
      lineItem: { description: 'Design work', quantity: 1, unitPrice: 500 },
    });
    expect(result.hasNextPage).toBe(false);
  });

  it('sends the authenticated request with Authorization and org-token headers', async () => {
    mock.onGet(API_ENDPOINTS.INVOICES).reply(config => {
      expect(config.headers?.Authorization).toBe('Bearer access-123');
      expect(config.headers?.['org-token']).toBe('org-456');
      return [200, emptyList];
    });

    await repository.getInvoices({ page: 1, pageSize: 20 });
  });

  it("translates the domain query into the server's query-param dialect", async () => {
    mock.onGet(API_ENDPOINTS.INVOICES).reply(config => {
      expect(config.params).toMatchObject({
        pageNum: 2,
        pageSize: 10,
        keyword: 'acme',
        status: 'Paid',
        sortBy: 'TOTAL_AMOUNT',
        ordering: 'ASCENDING',
      });
      return [200, emptyList];
    });

    await repository.getInvoices({
      page: 2,
      pageSize: 10,
      search: 'acme',
      status: 'Paid',
      sortBy: 'amount',
      sortDirection: 'asc',
    });
  });

  it('creates an invoice by mapping the domain input to the batch wire DTO', async () => {
    mock.onPost(API_ENDPOINTS.INVOICES).reply(config => {
      expect(config.headers?.['Operation-Mode']).toBe('SYNC');
      const body = JSON.parse(config.data);
      const invoice = body.invoices[0];
      expect(invoice).toMatchObject({
        currency: 'USD',
        invoiceDate: '2026-07-01',
        dueDate: '2026-07-15',
        customer: { firstName: 'Acme', lastName: 'Corp' },
        items: [{ description: 'Consulting', quantity: 2, rate: 150 }],
      });
      return [
        201,
        {
          data: [
            {
              invoiceId: 'inv_2',
              invoiceNumber: 'INV-002',
              customer: invoice.customer,
              status: [{ key: 'Due', value: true }],
              invoiceDate: invoice.invoiceDate,
              dueDate: invoice.dueDate,
              totalAmount: 300,
              currency: invoice.currency,
              items: invoice.items,
            },
          ],
        },
      ];
    });

    const created = await repository.createInvoice({
      customerName: 'Acme Corp',
      currency: 'USD',
      issueDate: '2026-07-01',
      dueDate: '2026-07-15',
      lineItem: { description: 'Consulting', quantity: 2, unitPrice: 150 },
    });

    expect(created.invoiceNumber).toBe('INV-002');
  });

  it('maps a 401 response to an ApiError of type UNAUTHORIZED', async () => {
    mock.onGet(API_ENDPOINTS.INVOICES).reply(401, { message: 'Token expired' });

    await expect(repository.getInvoices({ page: 1, pageSize: 20 })).rejects.toMatchObject({
      type: ApiErrorType.UNAUTHORIZED,
    });
  });

  it('maps a 500 response to an ApiError of type SERVER', async () => {
    mock.onGet(API_ENDPOINTS.INVOICES).reply(500);

    const error = await repository.getInvoices({ page: 1, pageSize: 20 }).catch(e => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).type).toBe(ApiErrorType.SERVER);
  });

  it('maps a network error (no response) to an ApiError of type NETWORK', async () => {
    mock.onGet(API_ENDPOINTS.INVOICES).networkError();

    const error = await repository.getInvoices({ page: 1, pageSize: 20 }).catch(e => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).type).toBe(ApiErrorType.NETWORK);
  });
});
