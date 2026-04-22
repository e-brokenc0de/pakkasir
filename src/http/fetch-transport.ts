import { ApiError } from '../errors/api-error.js';
import { NetworkError } from '../errors/network-error.js';
import type { JsonObject, JsonValue } from '../types/utility.js';
import type { HttpTransport } from './transport.js';
import type { HttpMethod, HttpRequest, HttpResponse, QueryParams } from './types.js';

/**
 * Configuration accepted by {@link FetchTransport}.
 */
export interface FetchTransportOptions {
  /** Fully-qualified base URL, e.g. `https://app.pakasir.com`. */
  readonly baseUrl: string;
  /** API key injected into every request (body for POST/PUT, query for GET). */
  readonly apiKey: string;
  /** Default headers applied to every request; per-request headers win. */
  readonly defaultHeaders: Readonly<Record<string, string>>;
  /** Default timeout in milliseconds (per request override is supported). */
  readonly timeoutMs: number;
  /** Optional `fetch` implementation override (useful in non-browser / non-Node runtimes). */
  readonly fetch?: typeof globalThis.fetch;
}

type HttpMethodWithBody = Extract<HttpMethod, 'POST' | 'PUT' | 'PATCH'>;

const METHODS_WITH_BODY: ReadonlySet<HttpMethod> = new Set<HttpMethodWithBody>([
  'POST',
  'PUT',
  'PATCH',
]);

/**
 * Default `HttpTransport` implementation backed by the global `fetch`.
 *
 * This is the only file in the SDK that performs network I/O. Everything
 * else — modules, the client, the request builder — is pure logic.
 */
export class FetchTransport implements HttpTransport {
  readonly #options: FetchTransportOptions;
  readonly #fetch: typeof globalThis.fetch;

  public constructor(options: FetchTransportOptions) {
    this.#options = options;
    const resolvedFetch = options.fetch ?? globalThis.fetch;
    if (typeof resolvedFetch !== 'function') {
      throw new Error(
        'No `fetch` implementation found. Pass `options.fetch` to FetchTransport or run on Node 18+.',
      );
    }
    this.#fetch = resolvedFetch;
  }

  public async send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const hasBody = METHODS_WITH_BODY.has(request.method);

    const mergedQuery: QueryParams = hasBody
      ? (request.query ?? {})
      : { ...(request.query ?? {}), api_key: this.#options.apiKey };

    const url = this.#buildUrl(request.path, mergedQuery);

    const mergedBody: JsonObject | undefined = hasBody
      ? { ...(request.body ?? {}), api_key: this.#options.apiKey }
      : undefined;

    const controller = new AbortController();
    const effectiveTimeout = request.timeoutMs ?? this.#options.timeoutMs;
    const timer =
      effectiveTimeout > 0
        ? setTimeout(() => {
            controller.abort(new Error('Request timed out.'));
          }, effectiveTimeout)
        : undefined;

    const externalSignal = request.signal;
    const onExternalAbort = (): void => {
      controller.abort(externalSignal?.reason);
    };
    if (externalSignal !== undefined) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.#options.defaultHeaders,
      ...(request.headers ?? {}),
    };
    if (mergedBody !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const init: RequestInit = {
      method: request.method,
      headers,
      signal: controller.signal,
    };
    if (mergedBody !== undefined) {
      init.body = JSON.stringify(mergedBody);
    }

    let response: Response;
    try {
      response = await this.#fetch(url, init);
    } catch (cause) {
      throw new NetworkError(cause instanceof Error ? cause.message : 'Network request failed.', {
        url,
        method: request.method,
        cause,
      });
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      if (externalSignal !== undefined) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }

    const rawBody = await response.text();
    const parsed = safeParseJson(rawBody);

    if (!response.ok) {
      throw new ApiError(
        `Pakasir API responded with HTTP ${response.status} ${response.statusText}.`,
        {
          status: response.status,
          statusText: response.statusText,
          body: parsed,
          rawBody,
          method: request.method,
          url,
        },
      );
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: extractHeaders(response.headers),
      body: parsed as T,
      rawBody,
    };
  }

  #buildUrl(path: string, query: QueryParams): string {
    const base = this.#options.baseUrl.replace(/\/+$/, '');
    const normalisedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${normalisedPath}`);
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}

function safeParseJson(text: string): JsonValue | null {
  if (text.length === 0) {
    return null;
  }
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return null;
  }
}

function extractHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
