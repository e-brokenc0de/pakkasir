import { PakasirError } from './base.js';
import type { JsonValue } from '../types/utility.js';

/**
 * Details captured from a non-2xx HTTP response.
 */
export interface ApiErrorDetails {
  /** HTTP status code, e.g. `401`, `422`, `500`. */
  readonly status: number;
  /** HTTP status text, e.g. `"Unauthorized"`. */
  readonly statusText: string;
  /** Parsed JSON body if the response was valid JSON; `null` otherwise. */
  readonly body: JsonValue | null;
  /** Raw text body as received, useful for debugging. */
  readonly rawBody: string;
  /** The HTTP method used for the request. */
  readonly method: string;
  /** The full URL that was requested. */
  readonly url: string;
}

/**
 * Thrown when the Pakasir API returns an HTTP error response (4xx / 5xx).
 */
export class ApiError extends PakasirError {
  public readonly kind = 'api' as const;
  public readonly status: number;
  public readonly statusText: string;
  public readonly body: JsonValue | null;
  public readonly rawBody: string;
  public readonly method: string;
  public readonly url: string;

  public constructor(message: string, details: ApiErrorDetails) {
    super(message);
    this.status = details.status;
    this.statusText = details.statusText;
    this.body = details.body;
    this.rawBody = details.rawBody;
    this.method = details.method;
    this.url = details.url;
  }

  /** Convenience check — true for HTTP 4xx responses. */
  public get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** Convenience check — true for HTTP 5xx responses. */
  public get isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}
