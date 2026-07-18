import { z } from 'zod';

/**
 * Mirrors the invariants re-asserted in `CreateInvoiceUseCase` on purpose:
 * this schema exists for INSTANT inline field feedback as the user types;
 * the use case exists as the non-bypassable business-rule gate. Two layers
 * of validation, two different jobs — see DECISIONS.md.
 */
export const createInvoiceSchema = z
  .object({
    customerName: z.string().min(1, 'Customer name is required').max(120),
    currency: z.string().min(1, 'Currency is required'),
    issueDate: z.string().min(1, 'Issue date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    description: z.string().min(1, 'Description is required').max(200),
    quantity: z
      .string()
      .min(1, 'Quantity is required')
      .refine(v => Number(v) > 0, 'Quantity must be greater than zero'),
    unitPrice: z
      .string()
      .min(1, 'Unit price is required')
      .refine(v => Number(v) > 0, 'Unit price must be greater than zero'),
  })
  .refine(data => new Date(data.dueDate) >= new Date(data.issueDate), {
    message: 'Due date cannot be before the issue date',
    path: ['dueDate'],
  });

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;
