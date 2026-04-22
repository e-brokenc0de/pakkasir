import { describe, expect, it } from 'vitest';
import { ValidationError } from '../src/errors/validation-error.js';
import { buildPaymentRedirectUrl } from '../src/utils/url.js';

describe('buildPaymentRedirectUrl', () => {
  it('builds a minimal URL with project, amount, and order_id', () => {
    const url = buildPaymentRedirectUrl({
      project: 'my-shop',
      amount: 15000,
      orderId: 'INV-001',
    });
    expect(url).toBe('https://app.pakasir.com/pay/my-shop/15000?order_id=INV-001');
  });

  it('adds qris_only and redirect query params when provided', () => {
    const url = buildPaymentRedirectUrl({
      project: 'my-shop',
      amount: 15000,
      orderId: 'INV-001',
      qrisOnly: true,
      redirectUrl: 'https://merchant.example.com/thanks',
    });
    expect(url).toContain('qris_only=1');
    expect(url).toContain('redirect=https%3A%2F%2Fmerchant.example.com%2Fthanks');
  });

  it('respects a custom base URL', () => {
    const url = buildPaymentRedirectUrl({
      project: 'my-shop',
      amount: 1,
      orderId: 'X',
      baseUrl: 'https://sandbox.pakasir.com/',
    });
    expect(url.startsWith('https://sandbox.pakasir.com/pay/my-shop/1?')).toBe(true);
  });

  it('rejects invalid inputs', () => {
    expect(() => buildPaymentRedirectUrl({ project: '', amount: 1, orderId: 'X' })).toThrow(
      ValidationError,
    );
    expect(() => buildPaymentRedirectUrl({ project: 'p', amount: 0, orderId: 'X' })).toThrow(
      ValidationError,
    );
    expect(() => buildPaymentRedirectUrl({ project: 'p', amount: 1, orderId: '' })).toThrow(
      ValidationError,
    );
  });
});
