import { describe, expect, it } from 'vitest';
import { WebhookVerificationError } from '../src/errors/webhook-error.js';
import { WebhooksModule } from '../src/modules/webhooks/webhooks.module.js';
import type { WebhookPayload } from '../src/modules/webhooks/types.js';

const VALID: WebhookPayload = {
  amount: 15000,
  order_id: 'INV-001',
  project: 'my-shop',
  status: 'completed',
  payment_method: 'qris',
  completed_at: '2026-04-22T10:00:00.000Z',
};

describe('WebhooksModule.parse', () => {
  it('parses a string body', () => {
    const wh = new WebhooksModule();
    expect(wh.parse(JSON.stringify(VALID))).toEqual(VALID);
  });

  it('accepts pre-parsed JSON', () => {
    const wh = new WebhooksModule();
    expect(wh.parse(VALID)).toEqual(VALID);
  });

  it('rejects malformed JSON', () => {
    const wh = new WebhooksModule();
    expect(() => wh.parse('{ not json')).toThrow(WebhookVerificationError);
  });

  it('rejects payloads missing required fields', () => {
    const wh = new WebhooksModule();
    const { completed_at: _unused, ...rest } = VALID;
    expect(() => wh.parse(rest)).toThrow(WebhookVerificationError);
  });

  it('rejects payloads with an unknown payment_method', () => {
    const wh = new WebhooksModule();
    expect(() => wh.parse({ ...VALID, payment_method: 'paypal' })).toThrow(
      WebhookVerificationError,
    );
  });
});

describe('WebhooksModule.verify', () => {
  const wh = new WebhooksModule();

  it('passes when all expected fields match', () => {
    const res = wh.verify(VALID, {
      expectedOrderId: 'INV-001',
      expectedAmount: 15000,
      expectedProject: 'my-shop',
    });
    expect(res.status).toBe('completed');
  });

  it('rejects order_id mismatch', () => {
    expect(() => wh.verify(VALID, { expectedOrderId: 'OTHER', expectedAmount: 15000 })).toThrow(
      WebhookVerificationError,
    );
  });

  it('rejects amount mismatch', () => {
    expect(() => wh.verify(VALID, { expectedOrderId: 'INV-001', expectedAmount: 99 })).toThrow(
      WebhookVerificationError,
    );
  });

  it('rejects project mismatch when expectedProject is specified', () => {
    expect(() =>
      wh.verify(VALID, {
        expectedOrderId: 'INV-001',
        expectedAmount: 15000,
        expectedProject: 'other',
      }),
    ).toThrow(WebhookVerificationError);
  });

  it('exposes isPaymentSuccess', () => {
    expect(wh.isPaymentSuccess(VALID)).toBe(true);
    expect(wh.isPaymentSuccess({ ...VALID, status: 'pending' })).toBe(false);
  });
});
