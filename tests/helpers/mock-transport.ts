import { ApiError } from '../../src/errors/api-error.js';
import { NetworkError } from '../../src/errors/network-error.js';
import type { HttpRequest, HttpResponse } from '../../src/http/types.js';
import type { HttpTransport } from '../../src/http/transport.js';
import type { JsonValue } from '../../src/types/utility.js';

/**
 * Represents a canned response queued on {@link MockTransport}.
 *
 * Either supply `body` (JSON-serialisable) for a 2xx success, or `throw` to
 * short-circuit with a specific error.
 */
export type MockResponse =
  | {
      readonly kind: 'success';
      readonly status?: number;
      readonly body: JsonValue;
      readonly headers?: Readonly<Record<string, string>>;
    }
  | {
      readonly kind: 'api-error';
      readonly status: number;
      readonly statusText?: string;
      readonly body?: JsonValue;
    }
  | {
      readonly kind: 'network-error';
      readonly message?: string;
    };

/**
 * Minimal in-memory `HttpTransport` used across the test suite.
 *
 * - `enqueue()` queues canned responses; `send()` pops them in FIFO order.
 * - Every request is recorded on `calls` for assertion.
 * - No `any` — all generics are preserved.
 */
export class MockTransport implements HttpTransport {
  public readonly calls: HttpRequest[] = [];
  readonly #queue: MockResponse[] = [];
  readonly #baseUrl: string;
  readonly #apiKey: string;

  public constructor(options: { baseUrl?: string; apiKey?: string } = {}) {
    this.#baseUrl = options.baseUrl ?? 'https://app.pakasir.com';
    this.#apiKey = options.apiKey ?? 'test-key';
  }

  /** Queue a canned response (FIFO). */
  public enqueue(response: MockResponse): void {
    this.#queue.push(response);
  }

  /** Queue a 200 JSON body. Shortcut for the common case. */
  public enqueueSuccess(body: JsonValue, status = 200): void {
    this.enqueue({ kind: 'success', status, body });
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- interface requires Promise return; no I/O is performed.
  public async send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    this.calls.push(request);
    const next = this.#queue.shift();
    if (next === undefined) {
      throw new Error(`MockTransport: no response queued for ${request.method} ${request.path}`);
    }
    const url = `${this.#baseUrl}${request.path}`;
    switch (next.kind) {
      case 'success': {
        const rawBody = JSON.stringify(next.body);
        const response: HttpResponse<T> = {
          status: next.status ?? 200,
          statusText: 'OK',
          headers: next.headers ?? {},
          body: next.body as T,
          rawBody,
        };
        return response;
      }
      case 'api-error': {
        const rawBody = next.body !== undefined ? JSON.stringify(next.body) : '';
        throw new ApiError(
          `Pakasir API responded with HTTP ${next.status} ${next.statusText ?? ''}`.trim(),
          {
            status: next.status,
            statusText: next.statusText ?? '',
            body: next.body ?? null,
            rawBody,
            method: request.method,
            url,
          },
        );
      }
      case 'network-error': {
        throw new NetworkError(next.message ?? 'Simulated network failure.', {
          url,
          method: request.method,
        });
      }
    }
  }

  /** Injected `api_key` is only a concern of the real transport; stub exposes helpers so callers can simulate it. */
  public get apiKey(): string {
    return this.#apiKey;
  }
}
