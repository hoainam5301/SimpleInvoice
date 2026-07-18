import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CreateInvoiceScreen } from '../../src/presentation/screens/CreateInvoice/CreateInvoiceScreen';
import { useCreateInvoice } from '../../src/presentation/hooks/useCreateInvoice';

jest.mock('../../src/presentation/hooks/useCreateInvoice');

const mockedUseCreateInvoice = useCreateInvoice as jest.MockedFunction<typeof useCreateInvoice>;

function setup(overrides: Partial<ReturnType<typeof useCreateInvoice>> = {}) {
  mockedUseCreateInvoice.mockReturnValue({
    submit: jest.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    error: undefined,
    isSuccess: false,
    reset: jest.fn(),
    ...overrides,
  });
}

type ScreenProps = React.ComponentProps<typeof CreateInvoiceScreen>;
const navigation = { goBack: jest.fn(), navigate: jest.fn() } as unknown as ScreenProps['navigation'];
const route = {} as ScreenProps['route'];

function renderScreen() {
  return render(<CreateInvoiceScreen navigation={navigation} route={route} />);
}

describe('CreateInvoiceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setup();
  });

  it('renders the single line-item form fields', () => {
    renderScreen();
    expect(screen.getByTestId('create-invoice-customerName')).toBeTruthy();
    expect(screen.getByTestId('create-invoice-description')).toBeTruthy();
    expect(screen.getByTestId('create-invoice-quantity')).toBeTruthy();
    expect(screen.getByTestId('create-invoice-unitPrice')).toBeTruthy();
    expect(screen.getByTestId('create-invoice-submit')).toBeTruthy();
  });

  it('blocks submit and shows a field error when required fields are empty', async () => {
    const submit = jest.fn();
    setup({ submit });
    renderScreen();

    fireEvent.press(screen.getByTestId('create-invoice-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('create-invoice-customerName-error')).toBeTruthy(),
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits mapped domain values and shows the success modal', async () => {
    const submit = jest.fn().mockResolvedValue(undefined);
    setup({ submit });
    renderScreen();

    fireEvent.changeText(screen.getByTestId('create-invoice-customerName'), 'Acme Corp');
    fireEvent.changeText(screen.getByTestId('create-invoice-description'), 'Consulting');
    fireEvent.changeText(screen.getByTestId('create-invoice-unitPrice'), '150');
    fireEvent.press(screen.getByTestId('create-invoice-submit'));

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Acme Corp',
          currency: 'USD',
          lineItem: expect.objectContaining({
            description: 'Consulting',
            quantity: 1,
            unitPrice: 150,
          }),
        }),
      ),
    );
    await waitFor(() => expect(screen.getByTestId('create-success-modal')).toBeTruthy());
  });

  it('dismisses the success modal and navigates back on OK', async () => {
    const submit = jest.fn().mockResolvedValue(undefined);
    setup({ submit });
    renderScreen();

    fireEvent.changeText(screen.getByTestId('create-invoice-customerName'), 'Acme Corp');
    fireEvent.changeText(screen.getByTestId('create-invoice-description'), 'Consulting');
    fireEvent.changeText(screen.getByTestId('create-invoice-unitPrice'), '150');
    fireEvent.press(screen.getByTestId('create-invoice-submit'));

    await waitFor(() => expect(screen.getByTestId('create-success-ok')).toBeTruthy());
    fireEvent.press(screen.getByTestId('create-success-ok'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('alerts when the hook reports an error', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setup({ error: 'Server rejected the invoice' });
    renderScreen();

    expect(alertSpy).toHaveBeenCalledWith('Could not create invoice', 'Server rejected the invoice');
    alertSpy.mockRestore();
  });
});
