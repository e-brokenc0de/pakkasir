/**
 * Shared primitive and domain types used across the Pakasir SDK.
 */

/**
 * Payment methods supported by the Pakasir gateway.
 *
 * The string values are the exact identifiers expected by the Pakasir API
 * path segment in `POST /api/transactioncreate/{method}`.
 */
export type PaymentMethod =
  | 'qris'
  | 'cimb_niaga_va'
  | 'bni_va'
  | 'sampoerna_va'
  | 'bnc_va'
  | 'maybank_va'
  | 'permata_va'
  | 'atm_bersama_va'
  | 'artha_graha_va'
  | 'bri_va';

/**
 * All supported payment methods enumerated as a readonly tuple.
 *
 * Useful for runtime validation and for rendering method-picker UIs.
 */
export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'qris',
  'cimb_niaga_va',
  'bni_va',
  'sampoerna_va',
  'bnc_va',
  'maybank_va',
  'permata_va',
  'atm_bersama_va',
  'artha_graha_va',
  'bri_va',
] as const;

/**
 * Lifecycle status of a Pakasir transaction.
 *
 * Pakasir returns strings such as `"pending"`, `"completed"`, or `"cancelled"`;
 * unknown strings are preserved verbatim for forward compatibility.
 */
export type TransactionStatus =
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'failed'
  | (string & { readonly __brand?: 'TransactionStatus' });

/**
 * Project slug — the identifier shown on the Pakasir Project detail page.
 */
export type ProjectSlug = string;

/**
 * Merchant-side order identifier. Must be unique per transaction.
 */
export type OrderId = string;

/**
 * Payment amount in the smallest currency unit (IDR rupiah — no cents).
 */
export type AmountIDR = number;

/**
 * ISO-8601 timestamp string, e.g. `2025-04-22T11:03:45.000Z`.
 */
export type IsoDateTime = string;
