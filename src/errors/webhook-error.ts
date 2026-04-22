import { PakasirError } from './base.js';

/**
 * Thrown when a webhook payload cannot be parsed or does not match the
 * expected Pakasir schema.
 */
export class WebhookVerificationError extends PakasirError {
  public readonly kind = 'webhook' as const;
  /** The raw body that failed verification (for debugging / logging). */
  public readonly rawBody: string;

  public constructor(message: string, details: { readonly rawBody: string }) {
    super(message);
    this.rawBody = details.rawBody;
  }
}
