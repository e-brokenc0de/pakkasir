import { ValidationError } from '../errors/validation-error.js';

/**
 * Narrow `unknown` to a plain record of `unknown` values.
 *
 * Rejects arrays, `null`, and non-object primitives.
 */
export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Assert that `value` is a non-empty string.
 *
 * @throws {ValidationError} if the assertion fails.
 */
export function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ValidationError(`Expected "${field}" to be a non-empty string.`, { field });
  }
}

/**
 * Assert that `value` is a positive (> 0), finite integer.
 *
 * @throws {ValidationError} if the assertion fails.
 */
export function assertPositiveInteger(value: unknown, field: string): asserts value is number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new ValidationError(`Expected "${field}" to be a positive integer.`, { field });
  }
}

/**
 * Assert that `value` is defined (not `null` or `undefined`).
 *
 * Narrows the type to `NonNullable<T>`.
 *
 * @throws {ValidationError} if the assertion fails.
 */
export function assertDefined<T>(value: T, field: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new ValidationError(`Expected "${field}" to be defined.`, { field });
  }
}
