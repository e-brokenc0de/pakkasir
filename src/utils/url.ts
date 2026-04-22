import { assertNonEmptyString, assertPositiveInteger } from './assert.js';
import type { AmountIDR, OrderId, ProjectSlug } from '../types/common.js';

/**
 * Input parameters for {@link buildPaymentRedirectUrl}.
 */
export interface PaymentRedirectInput {
  /** Project slug (the Pakasir project identifier). */
  readonly project: ProjectSlug;
  /** Payment amount in IDR (integer, no cents). */
  readonly amount: AmountIDR;
  /** Merchant-side order identifier. */
  readonly orderId: OrderId;
  /** Optional post-payment redirect URL. */
  readonly redirectUrl?: string;
  /** If `true`, only the QRIS payment method is shown on the hosted page. */
  readonly qrisOnly?: boolean;
  /** Override the hosted-page base URL (defaults to `https://app.pakasir.com`). */
  readonly baseUrl?: string;
}

/**
 * Build a URL for the hosted Pakasir payment page.
 *
 * This URL integration does **not** require an API key — it is safe to expose
 * directly in a browser. The link format is documented in the Pakasir docs as:
 *
 * `https://app.pakasir.com/pay/{slug}/{amount}?order_id={order_id}`
 *
 * @example
 * ```ts
 * const url = buildPaymentRedirectUrl({
 *   project: 'my-shop',
 *   amount: 15_000,
 *   orderId: 'INV-001',
 *   qrisOnly: true,
 * });
 * // → https://app.pakasir.com/pay/my-shop/15000?order_id=INV-001&qris_only=1
 * ```
 */
export function buildPaymentRedirectUrl(input: PaymentRedirectInput): string {
  assertNonEmptyString(input.project, 'project');
  assertPositiveInteger(input.amount, 'amount');
  assertNonEmptyString(input.orderId, 'orderId');

  const base = (input.baseUrl ?? 'https://app.pakasir.com').replace(/\/+$/, '');
  const url = new URL(`${base}/pay/${encodeURIComponent(input.project)}/${input.amount}`);
  url.searchParams.set('order_id', input.orderId);
  if (input.redirectUrl !== undefined) {
    url.searchParams.set('redirect', input.redirectUrl);
  }
  if (input.qrisOnly === true) {
    url.searchParams.set('qris_only', '1');
  }
  return url.toString();
}
