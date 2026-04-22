import { PakasirError } from './base.js';

/**
 * Thrown when client-side input fails validation before an HTTP call is made.
 *
 * These errors never leave the SDK unless the caller provided malformed data,
 * so they indicate a programming bug rather than a server condition.
 */
export class ValidationError extends PakasirError {
  public readonly kind = 'validation' as const;
  /** The name of the field that failed validation, if known. */
  public readonly field: string | undefined;

  public constructor(message: string, details?: { readonly field?: string }) {
    super(message);
    this.field = details?.field;
  }
}
