import type { HttpRequest, HttpResponse } from './types.js';

/**
 * The transport abstraction that the Pakasir SDK calls into.
 *
 * Implementations are responsible for:
 *   - Building the final URL from a base URL + `req.path` + query params.
 *   - Serialising the JSON body.
 *   - Merging `api_key` into the payload (body for POST, query for GET).
 *   - Decoding the response body.
 *   - Throwing {@link NetworkError} on transport failure and {@link ApiError}
 *     on non-2xx responses.
 *
 * The `T` generic lets callers tell the transport how to interpret the body.
 * The transport is not required to validate that the body is actually `T` —
 * that is the caller's job (typically in a module, via a type guard).
 *
 * Swappable implementations make the client trivial to unit-test: inject a
 * `MockTransport` instead of the default `FetchTransport`.
 */
export interface HttpTransport {
  send<T>(request: HttpRequest): Promise<HttpResponse<T>>;
}
