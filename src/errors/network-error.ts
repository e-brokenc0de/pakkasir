import { PakasirError } from './base.js';

/**
 * Thrown when the HTTP request fails before a response is received
 * (DNS failure, TCP reset, TLS error, timeout, fetch abort, etc.).
 */
export class NetworkError extends PakasirError {
  public readonly kind = 'network' as const;
  public readonly url: string;
  public readonly method: string;

  public constructor(
    message: string,
    details: { readonly url: string; readonly method: string; readonly cause?: unknown },
  ) {
    super(message, details.cause !== undefined ? { cause: details.cause } : undefined);
    this.url = details.url;
    this.method = details.method;
  }
}
