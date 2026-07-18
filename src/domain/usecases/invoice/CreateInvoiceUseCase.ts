import type { InvoiceRepository } from '../../repositories/InvoiceRepository';
import type { CreateInvoiceInput, Invoice } from '../../entities/Invoice';
import { isNonEmptyString, isPositiveNumber } from '../../../core/utils/validators';

export class InvalidInvoiceInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInvoiceInputError';
  }
}

/**
 * Field-level UX validation lives in the Zod schema (src/presentation/screens/
 * CreateInvoice/schema.ts) so the user gets instant inline feedback. This
 * use case re-asserts the same invariants as a business-rule safety net —
 * the domain layer must never trust that "the form validated it" is the
 * only line of defense, since use cases can be invoked from anywhere
 * (deep links, future admin tooling, tests) that bypasses the form.
 */
export class CreateInvoiceUseCase {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: CreateInvoiceInput): Promise<Invoice> {
    this.assertValid(input);
    return this.invoiceRepository.createInvoice(input);
  }

  private assertValid(input: CreateInvoiceInput): void {
    if (!isNonEmptyString(input.customerName)) {
      throw new InvalidInvoiceInputError('Customer name is required.');
    }
    if (!isNonEmptyString(input.lineItem?.description)) {
      throw new InvalidInvoiceInputError('Line item description is required.');
    }
    if (!isPositiveNumber(input.lineItem?.quantity)) {
      throw new InvalidInvoiceInputError('Line item quantity must be greater than zero.');
    }
    if (!isPositiveNumber(input.lineItem?.unitPrice)) {
      throw new InvalidInvoiceInputError('Line item unit price must be greater than zero.');
    }
    if (new Date(input.dueDate) < new Date(input.issueDate)) {
      throw new InvalidInvoiceInputError('Due date cannot be before the issue date.');
    }
  }
}
