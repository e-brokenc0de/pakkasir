import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/errors/api-error.js';
import { NetworkError } from '../src/errors/network-error.js';
import { FetchTransport } from '../src/http/fetch-transport.js';

type FetchFn = typeof globalThis.fetch;
type FetchArgs = Parameters<FetchFn>;

interface FetchSpy {
  readonly fetch: FetchFn;
  readonly calls: FetchArgs[];
}

/**
 * Hand-rolled spy that wraps a fetch implementation and records every call.
 *
 * We avoid `vi.fn<FetchFn>` here because Vitest 1.6's `Mock<TArgs, TReturn>`
 * generic does not accept overloaded call signatures like `typeof fetch`.
 */
function makeFetchSpy(impl: FetchFn): FetchSpy {
  const calls: FetchArgs[] = [];
  const fetch: FetchFn = (...args: FetchArgs) => {
    calls.push(args);
    return impl(...args);
  };
  return { fetch, calls };
}

function makeOkResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function firstCall(spy: FetchSpy): FetchArgs {
  const call = spy.calls[0];
  if (call === undefined) throw new Error('fetch was not called');
  return call;
}

describe('FetchTransport', () => {
  it('injects api_key into the JSON body for POST requests', async () => {
    const spy = makeFetchSpy(() => Promise.resolve(makeOkResponse({ ok: true })));
    const transport = new FetchTransport({
      baseUrl: 'https://app.pakasir.com',
      apiKey: 'secret',
      defaultHeaders: {},
      timeoutMs: 5000,
      fetch: spy.fetch,
    });

    await transport.send({
      method: 'POST',
      path: '/api/transactioncreate/qris',
      body: { project: 'p', order_id: 'o', amount: 1 },
    });

    expect(spy.calls).toHaveLength(1);
    const [url, init] = firstCall(spy);
    expect(url).toBe('https://app.pakasir.com/api/transactioncreate/qris');
    expect(init?.method).toBe('POST');
    const body = init?.body;
    expect(typeof body).toBe('string');
    const parsedBody: unknown = JSON.parse(body as string);
    expect(parsedBody).toEqual({
      project: 'p',
      order_id: 'o',
      amount: 1,
      api_key: 'secret',
    });
  });

  it('injects api_key into the query string for GET requests', async () => {
    const spy = makeFetchSpy(() => Promise.resolve(makeOkResponse({ ok: true })));
    const transport = new FetchTransport({
      baseUrl: 'https://app.pakasir.com',
      apiKey: 'secret',
      defaultHeaders: {},
      timeoutMs: 5000,
      fetch: spy.fetch,
    });

    await transport.send({
      method: 'GET',
      path: '/api/transactiondetail',
      query: { project: 'p', order_id: 'o', amount: 1 },
    });

    const [url, init] = firstCall(spy);
    expect(typeof url).toBe('string');
    const parsed = new URL(url as string);
    expect(parsed.searchParams.get('api_key')).toBe('secret');
    expect(parsed.searchParams.get('project')).toBe('p');
    const reqBody: BodyInit | null | undefined = init?.body;
    expect(reqBody).toBeUndefined();
  });

  it('throws ApiError on non-2xx responses', async () => {
    const spy = makeFetchSpy(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'bad key' }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const transport = new FetchTransport({
      baseUrl: 'https://app.pakasir.com',
      apiKey: 'k',
      defaultHeaders: {},
      timeoutMs: 5000,
      fetch: spy.fetch,
    });

    await expect(
      transport.send({ method: 'POST', path: '/x', body: { a: 1 } }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('wraps fetch failures in NetworkError', async () => {
    const spy = makeFetchSpy(() => Promise.reject(new Error('ECONNRESET')));
    const transport = new FetchTransport({
      baseUrl: 'https://app.pakasir.com',
      apiKey: 'k',
      defaultHeaders: {},
      timeoutMs: 5000,
      fetch: spy.fetch,
    });

    await expect(transport.send({ method: 'POST', path: '/x', body: {} })).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  it('merges default headers with per-request headers and sets Content-Type on bodies', async () => {
    const spy = makeFetchSpy(() => Promise.resolve(makeOkResponse({})));
    const transport = new FetchTransport({
      baseUrl: 'https://app.pakasir.com',
      apiKey: 'k',
      defaultHeaders: { 'X-Client': 'pakkasir' },
      timeoutMs: 5000,
      fetch: spy.fetch,
    });

    await transport.send({
      method: 'POST',
      path: '/x',
      body: { a: 1 },
      headers: { 'X-Trace': 'abc' },
    });

    const [, init] = firstCall(spy);
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers['X-Client']).toBe('pakkasir');
    expect(headers['X-Trace']).toBe('abc');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Accept).toBe('application/json');
  });

  it('times out long-running requests', async () => {
    const pendingFetch: FetchFn = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal ?? null;
        signal?.addEventListener('abort', () => {
          reject(new Error('aborted'));
        });
      });
    const transport = new FetchTransport({
      baseUrl: 'https://x',
      apiKey: 'k',
      defaultHeaders: {},
      timeoutMs: 10,
      fetch: pendingFetch,
    });
    await expect(transport.send({ method: 'POST', path: '/y', body: {} })).rejects.toBeInstanceOf(
      NetworkError,
    );
  });
});
