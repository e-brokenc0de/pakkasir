import { ValidationError } from '../errors/validation-error.js';
import type { JsonObject } from '../types/utility.js';
import type { HttpTransport } from './transport.js';
import type { HttpMethod, HttpRequest, HttpResponse, QueryParams } from './types.js';

/**
 * Type guard applied to the raw response body by each module call.
 *
 * Returns `true` if `value` matches the expected shape `T`; the module can
 * then safely treat it as `T`.
 */
export type ResponseGuard<T> = (value: unknown) => value is T;

/**
 * Fluent, strongly-typed request builder that modules use to talk to the
 * transport. Modules never touch the transport directly — they build a
 * `RequestBuilder`, chain in their inputs, then `.send()`.
 *
 * Every type variable is tracked separately so inference survives end-to-end.
 */
export class RequestBuilder<TResponse> {
  readonly #transport: HttpTransport;
  readonly #method: HttpMethod;
  readonly #path: string;
  #body: JsonObject | undefined;
  #query: QueryParams | undefined;
  #headers: Record<string, string> | undefined;
  #timeoutMs: number | undefined;
  #signal: AbortSignal | undefined;
  readonly #guard: ResponseGuard<TResponse>;

  public constructor(
    transport: HttpTransport,
    method: HttpMethod,
    path: string,
    guard: ResponseGuard<TResponse>,
  ) {
    this.#transport = transport;
    this.#method = method;
    this.#path = path;
    this.#guard = guard;
  }

  /** Attach a JSON body. Subsequent calls replace the previous body. */
  public withBody(body: JsonObject): this {
    this.#body = body;
    return this;
  }

  /** Attach query-string parameters. Subsequent calls replace the previous value. */
  public withQuery(query: QueryParams): this {
    this.#query = query;
    return this;
  }

  /** Merge extra request headers (caller-provided headers win). */
  public withHeaders(headers: Readonly<Record<string, string>>): this {
    this.#headers = { ...(this.#headers ?? {}), ...headers };
    return this;
  }

  /** Set a per-request timeout (overrides the transport default). */
  public withTimeout(timeoutMs: number): this {
    this.#timeoutMs = timeoutMs;
    return this;
  }

  /** Attach an `AbortSignal`. */
  public withSignal(signal: AbortSignal): this {
    this.#signal = signal;
    return this;
  }

  /**
   * Execute the request and return a validated, typed response.
   *
   * @throws {@link ApiError} on non-2xx responses.
   * @throws {@link NetworkError} on transport failures.
   * @throws {@link ValidationError} if the body does not match the guard.
   */
  public async send(): Promise<TResponse> {
    const request: HttpRequest = buildHttpRequest({
      method: this.#method,
      path: this.#path,
      body: this.#body,
      query: this.#query,
      headers: this.#headers,
      timeoutMs: this.#timeoutMs,
      signal: this.#signal,
    });
    const response: HttpResponse<unknown> = await this.#transport.send<unknown>(request);
    if (!this.#guard(response.body)) {
      throw new ValidationError(
        `Pakasir response for ${this.#method} ${this.#path} did not match the expected shape.`,
      );
    }
    return response.body;
  }
}

interface BuildHttpRequestInput {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body: JsonObject | undefined;
  readonly query: QueryParams | undefined;
  readonly headers: Record<string, string> | undefined;
  readonly timeoutMs: number | undefined;
  readonly signal: AbortSignal | undefined;
}

/**
 * Assemble an `HttpRequest`, omitting `undefined` fields so downstream
 * `exactOptionalPropertyTypes`-checked code doesn't see unwanted keys.
 */
function buildHttpRequest(input: BuildHttpRequestInput): HttpRequest {
  const base: { method: HttpMethod; path: string } = {
    method: input.method,
    path: input.path,
  };
  const extras: {
    body?: JsonObject;
    query?: QueryParams;
    headers?: Readonly<Record<string, string>>;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {};
  if (input.body !== undefined) extras.body = input.body;
  if (input.query !== undefined) extras.query = input.query;
  if (input.headers !== undefined) extras.headers = input.headers;
  if (input.timeoutMs !== undefined) extras.timeoutMs = input.timeoutMs;
  if (input.signal !== undefined) extras.signal = input.signal;
  return { ...base, ...extras };
}
