import type { JsonObject, JsonValue } from '../types/utility.js';

/**
 * HTTP verbs used by the Pakasir API surface.
 *
 * Kept as a literal union so the transport can exhaustively switch on it.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * A typed query-string parameter map.
 *
 * `undefined` values are dropped when serialising.
 */
export type QueryParams = Readonly<Record<string, string | number | boolean | undefined>>;

/**
 * A typed request passed from modules down into the transport.
 *
 * Modules produce pure values here; the transport is responsible for merging
 * in auth (`api_key`) and assembling the final URL.
 */
export interface HttpRequest {
  readonly method: HttpMethod;
  /** Path relative to the configured base URL, e.g. `/api/transactiondetail`. */
  readonly path: string;
  /** Optional JSON body; used for `POST`/`PUT`/`PATCH`. */
  readonly body?: JsonObject;
  /** Optional query-string parameters; used for `GET`/`DELETE`. */
  readonly query?: QueryParams;
  /** Per-request header overrides (merged over the client's defaults). */
  readonly headers?: Readonly<Record<string, string>>;
  /** Per-request timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Per-request abort signal. */
  readonly signal?: AbortSignal;
}

/**
 * The decoded response produced by a transport.
 *
 * `T` is the caller-asserted response body shape. Transports are free to parse
 * the body however they like, but must hand back a value that the caller can
 * treat as `T` — typically by doing a shape check in the module that issued
 * the request.
 */
export interface HttpResponse<T> {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: T;
  /** Raw text body (before JSON parsing) for debugging / logging. */
  readonly rawBody: string;
}

/**
 * A JSON-safe version of `HttpResponse` used when the caller does not yet
 * know the concrete body shape (e.g. inside transport implementations).
 */
export type RawHttpResponse = HttpResponse<JsonValue | null>;
