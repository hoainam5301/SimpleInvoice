import {
  CreateInvoiceUseCase,
  InvalidInvoiceInputError,
} from '../../../src/domain/usecases/invoice/CreateInvoiceUseCase';
import type { InvoiceRepository } from '../../../src/domain/repositories/InvoiceRepository';
import type { CreateInvoiceInput } from '../../../src/domain/entities/Invoice';

function makeInvoiceRepositoryMock(overrides: Partial<InvoiceRepository> = {}): InvoiceRepository {
  return {
    getInvoices: jest.fn(),
    createInvoice: jest.fn(),
    ...overrides,
  };
}

const validInput: CreateInvoiceInput = {
  customerName: 'Acme Corp',
  currency: 'USD',
  issueDate: '2026-07-01',
  dueDate: '2026-07-15',
  lineItem: { description: 'Consulting services', quantity: 2, unitPrice: 150 },
};

describe('CreateInvoiceUseCase', () => {
  it('creates an invoice when the input is valid', async () => {
    const repository = makeInvoiceRepositoryMock({
      createInvoice: jest.fn().mockResolvedValue({ id: 'inv_1', ...validInput }),
    });
    const useCase = new CreateInvoiceUseCase(repository);

    await useCase.execute(validInput);

    expect(repository.createInvoice).toHaveBeenCalledWith(validInput);
  });

  it('rejects when customer name is missing', async () => {
    const repository = makeInvoiceRepositoryMock();
    const useCase = new CreateInvoiceUseCase(repository);

    await expect(useCase.execute({ ...validInput, customerName: '' })).rejects.toThrow(
      InvalidInvoiceInputError,
    );
    expect(repository.createInvoice).not.toHaveBeenCalled();
  });

  it('rejects when line item quantity is zero or negative', async () => {
    const repository = makeInvoiceRepositoryMock();
    const useCase = new CreateInvoiceUseCase(repository);

    await expect(
      useCase.execute({ ...validInput, lineItem: { ...validInput.lineItem, quantity: 0 } }),
    ).rejects.toThrow(InvalidInvoiceInputError);
  });

  it('rejects when the due date is before the issue date', async () => {
    const repository = makeInvoiceRepositoryMock();
    const useCase = new CreateInvoiceUseCase(repository);

    await expect(
      useCase.execute({ ...validInput, issueDate: '2026-07-15', dueDate: '2026-07-01' }),
    ).rejects.toThrow('Due date cannot be before the issue date.');
  });
});
