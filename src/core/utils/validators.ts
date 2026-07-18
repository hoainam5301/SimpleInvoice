/**
 * Small framework-free predicates reused by both Zod schemas (presentation
 * forms) and use cases (domain-level guards) — kept dependency-free so the
 * domain layer never needs to import a validation library.
 */

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
