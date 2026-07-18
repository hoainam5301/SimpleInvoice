import { createInvoiceSchema } from '../../../src/presentation/screens/CreateInvoice/schema';

const validValues = {
  customerName: 'Acme Corp',
  currency: 'USD',
  issueDate: '2026-07-01',
  dueDate: '2026-07-15',
  description: 'Consulting',
  quantity: '2',
  unitPrice: '150',
};

function firstError(result: ReturnType<typeof createInvoiceSchema.safeParse>): string | undefined {
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('createInvoiceSchema', () => {
  it('accepts a fully valid invoice', () => {
    expect(createInvoiceSchema.safeParse(validValues).success).toBe(true);
  });

  it('rejects a blank customer name', () => {
    const result = createInvoiceSchema.safeParse({ ...validValues, customerName: '' });
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe('Customer name is required');
  });

  it('rejects a non-positive quantity', () => {
    const result = createInvoiceSchema.safeParse({ ...validValues, quantity: '0' });
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe('Quantity must be greater than zero');
  });

  it('rejects a non-positive unit price', () => {
    const result = createInvoiceSchema.safeParse({ ...validValues, unitPrice: '-5' });
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe('Unit price must be greater than zero');
  });

  it('rejects a due date earlier than the issue date', () => {
    const result = createInvoiceSchema.safeParse({
      ...validValues,
      issueDate: '2026-07-15',
      dueDate: '2026-07-01',
    });
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe('Due date cannot be before the issue date');
  });

  it('allows a due date equal to the issue date', () => {
    const result = createInvoiceSchema.safeParse({
      ...validValues,
      issueDate: '2026-07-10',
      dueDate: '2026-07-10',
    });
    expect(result.success).toBe(true);
  });
});
