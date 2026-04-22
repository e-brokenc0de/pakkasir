import { beforeEach, describe, expect, it } from 'vitest';
import { PakasirClient } from '../src/client.js';
import { ApiError } from '../src/errors/api-error.js';
import { NetworkError } from '../src/errors/network-error.js';
import { ValidationError } from '../src/errors/validation-error.js';
import { MockTransport } from './helpers/mock-transport.js';

function newClient(transport: MockTransport): PakasirClient {
  return new PakasirClient({
    apiKey: 'test-key',
    project: 'my-shop',
    transport,
  });
}

describe('TransactionsModule.create', () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = new MockTransport();
  });

  it('POSTs to /api/transactioncreate/{method} with the expected body', async () => {
    transport.enqueueSuccess({
      payment: {
        project: 'my-shop',
        order_id: 'INV-001',
        amount: 15000,
        fee: 500,
        total_payment: 15500,
        payment_method: 'qris',
        payment_number: '00020101...',
        expired_at: '2026-04-23T00:00:00.000Z',
      },
    });

    const client = newClient(transport);
    const result = await client.transactions.create({
      method: 'qris',
      orderId: 'INV-001',
      amount: 15000,
    });

    expect(result.payment.payment_number).toBe('00020101...');
    const call = transport.calls[0];
    expect(call).toBeDefined();
    if (call === undefined) throw new Error('missing call');
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/api/transactioncreate/qris');
    expect(call.body).toEqual({
      project: 'my-shop',
      order_id: 'INV-001',
      amount: 15000,
    });
  });

  it('rejects unknown payment methods at the type level via validation', async () => {
    const client = newClient(transport);
    await expect(
      client.transactions.create({
        // @ts-expect-error — deliberately unsafe cast for the runtime check.
        method: 'not-a-method',
        orderId: 'X',
        amount: 1,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('wraps 4xx responses in ApiError', async () => {
    transport.enqueue({
      kind: 'api-error',
      status: 401,
      statusText: 'Unauthorized',
      body: { error: 'bad api key' },
    });
    const client = newClient(transport);
    await expect(
      client.transactions.create({
        method: 'qris',
        orderId: 'INV-002',
        amount: 1000,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('wraps transport failures in NetworkError', async () => {
    transport.enqueue({ kind: 'network-error', message: 'ECONNRESET' });
    const client = newClient(transport);
    await expect(
      client.transactions.create({
        method: 'qris',
        orderId: 'INV-003',
        amount: 1000,
      }),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it('rejects non-positive amounts', async () => {
    const client = newClient(transport);
    await expect(
      client.transactions.create({
        method: 'qris',
        orderId: 'INV-X',
        amount: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('TransactionsModule.detail', () => {
  it('GETs /api/transactiondetail with the expected query', async () => {
    const transport = new MockTransport();
    transport.enqueueSuccess({
      transaction: {
        amount: 15000,
        order_id: 'INV-001',
        project: 'my-shop',
        status: 'completed',
        payment_method: 'qris',
        completed_at: '2026-04-22T10:00:00.000Z',
      },
    });

    const client = newClient(transport);
    const res = await client.transactions.detail({
      orderId: 'INV-001',
      amount: 15000,
    });
    expect(res.transaction.status).toBe('completed');

    const call = transport.calls[0];
    if (call === undefined) throw new Error('missing call');
    expect(call.method).toBe('GET');
    expect(call.path).toBe('/api/transactiondetail');
    expect(call.query).toEqual({
      project: 'my-shop',
      order_id: 'INV-001',
      amount: 15000,
    });
  });

  it('rejects mis-shaped response bodies with ValidationError', async () => {
    const transport = new MockTransport();
    transport.enqueueSuccess({ unexpected: true });
    const client = newClient(transport);
    await expect(
      client.transactions.detail({ orderId: 'INV-1', amount: 1000 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('TransactionsModule.cancel', () => {
  it('POSTs to /api/transactioncancel', async () => {
    const transport = new MockTransport();
    transport.enqueueSuccess({ success: true, message: 'Cancelled.' });
    const client = newClient(transport);

    const res = await client.transactions.cancel({
      orderId: 'INV-001',
      amount: 15000,
    });
    expect(res.success).toBe(true);
    const call = transport.calls[0];
    if (call === undefined) throw new Error('missing call');
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/api/transactioncancel');
  });
});

describe('TransactionsModule — overriding project per call', () => {
  it('uses an explicit project slug over the client default', async () => {
    const transport = new MockTransport();
    transport.enqueueSuccess({
      payment: {
        project: 'other',
        order_id: 'X',
        amount: 1,
        fee: 0,
        total_payment: 1,
        payment_method: 'qris',
        payment_number: 'foo',
        expired_at: '2026-04-23T00:00:00.000Z',
      },
    });
    const client = newClient(transport);
    await client.transactions.create({
      method: 'qris',
      orderId: 'X',
      amount: 1,
      project: 'other',
    });
    const call = transport.calls[0];
    if (call === undefined) throw new Error('missing call');
    expect(call.body).toMatchObject({ project: 'other' });
  });
});
