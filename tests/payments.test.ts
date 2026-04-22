import { describe, expect, it } from 'vitest';
import { PakasirClient } from '../src/client.js';
import { ValidationError } from '../src/errors/validation-error.js';
import { MockTransport } from './helpers/mock-transport.js';

describe('PaymentsModule.simulate', () => {
  it('POSTs to /api/paymentsimulation with payment_method in the body', async () => {
    const transport = new MockTransport();
    transport.enqueueSuccess({ success: true });
    const client = new PakasirClient({
      apiKey: 'k',
      project: 'my-shop',
      transport,
    });
    const res = await client.payments.simulate({
      method: 'bni_va',
      orderId: 'INV-9',
      amount: 5000,
    });
    expect(res.success).toBe(true);

    const call = transport.calls[0];
    if (call === undefined) throw new Error('missing call');
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/api/paymentsimulation');
    expect(call.body).toEqual({
      project: 'my-shop',
      order_id: 'INV-9',
      amount: 5000,
      payment_method: 'bni_va',
    });
  });

  it('validates payment method', async () => {
    const transport = new MockTransport();
    const client = new PakasirClient({
      apiKey: 'k',
      project: 'p',
      transport,
    });
    await expect(
      client.payments.simulate({
        // @ts-expect-error — runtime validation check.
        method: 'bogus',
        orderId: 'X',
        amount: 1,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
