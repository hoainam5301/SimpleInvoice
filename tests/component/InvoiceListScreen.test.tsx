import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { InvoiceListScreen } from '../../src/presentation/screens/InvoiceList/InvoiceListScreen';
import { useInvoices } from '../../src/presentation/hooks/useInvoices';
import { useInvoiceFilters } from '../../src/presentation/hooks/useInvoiceFilters';
import type { Invoice } from '../../src/domain/entities/Invoice';

jest.mock('../../src/presentation/hooks/useInvoices');
jest.mock('../../src/presentation/hooks/useInvoiceFilters');
jest.mock('../../src/presentation/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      fullName: 'James Vand',
      memberships: [{ organizationId: 'o1', organizationName: 'James Corp', token: 't' }],
    },
    isAuthenticated: true,
    isRestoring: false,
    logout: jest.fn(),
  }),
}));

const mockedUseInvoices = useInvoices as jest.MockedFunction<typeof useInvoices>;
const mockedUseInvoiceFilters = useInvoiceFilters as jest.MockedFunction<typeof useInvoiceFilters>;

const sampleInvoices: Invoice[] = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-001',
    customerName: 'Acme Corp',
    status: 'Due',
    issueDate: '2026-07-01',
    dueDate: '2026-07-15',
    amount: 300,
    currency: 'USD',
    lineItem: { description: 'Consulting', quantity: 2, unitPrice: 150 },
  },
];

function setupFilters(overrides: Partial<ReturnType<typeof useInvoiceFilters>> = {}) {
  mockedUseInvoiceFilters.mockReturnValue({
    search: '',
    setSearch: jest.fn(),
    status: undefined,
    setStatus: jest.fn(),
    sortBy: 'createdDate',
    sortDirection: 'desc',
    setSort: jest.fn(),
    reset: jest.fn(),
    filters: { search: '', status: undefined, sortBy: 'createdDate', sortDirection: 'desc' },
    ...overrides,
  });
}

function setupInvoices(overrides: Partial<ReturnType<typeof useInvoices>> = {}) {
  mockedUseInvoices.mockReturnValue({
    invoices: sampleInvoices,
    isInitialLoading: false,
    isFetchingMore: false,
    error: undefined,
    loadMore: jest.fn(),
    refresh: jest.fn(),
    ...overrides,
  });
}

type ScreenProps = React.ComponentProps<typeof InvoiceListScreen>;

const navigation = { navigate: jest.fn() } as unknown as ScreenProps['navigation'];
const route = {} as ScreenProps['route'];

describe('InvoiceListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFilters();
    setupInvoices();
  });

  it('renders the invoice list once loaded', () => {
    render(<InvoiceListScreen navigation={navigation} route={route} />);

    expect(screen.getByTestId('invoice-list')).toBeTruthy();
    expect(screen.getByTestId('invoice-item-inv_1')).toBeTruthy();
    expect(screen.getByText('INV-001')).toBeTruthy();
  });

  it('shows a loading indicator on initial load', () => {
    setupInvoices({ isInitialLoading: true, invoices: [] });
    render(<InvoiceListScreen navigation={navigation} route={route} />);

    expect(screen.getByTestId('invoice-list-loading')).toBeTruthy();
  });

  it('shows an error view with retry when loading fails', () => {
    const refresh = jest.fn();
    setupInvoices({ error: 'Unable to reach the server.', invoices: [], refresh });
    render(<InvoiceListScreen navigation={navigation} route={route} />);

    expect(screen.getByTestId('invoice-list-error')).toBeTruthy();
    fireEvent.press(screen.getByText('Try again'));
    expect(refresh).toHaveBeenCalled();
  });

  it('navigates to CreateInvoice when the CTA is pressed', () => {
    render(<InvoiceListScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByTestId('create-invoice-cta'));

    expect(navigation.navigate).toHaveBeenCalledWith('CreateInvoice');
  });

  it('forwards the search input to setSearch', () => {
    const setSearch = jest.fn();
    setupFilters({ setSearch });
    render(<InvoiceListScreen navigation={navigation} route={route} />);

    fireEvent.changeText(screen.getByTestId('invoice-search-input'), 'acme');

    expect(setSearch).toHaveBeenCalledWith('acme');
  });
});
