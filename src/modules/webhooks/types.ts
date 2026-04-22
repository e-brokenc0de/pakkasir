import type {
  AmountIDR,
  IsoDateTime,
  OrderId,
  PaymentMethod,
  ProjectSlug,
  TransactionStatus,
} from '../../types/common.js';

/**
 * Payload delivered to the merchant's configured webhook URL when a payment
 * successfully completes.
 *
 * Note: the Pakasir docs warn that merchants **must** verify `amount` and
 * `order_id` match the merchant-side record before fulfilling an order.
 */
export interface WebhookPayload {
  readonly amount: AmountIDR;
  readonly order_id: OrderId;
  readonly project: ProjectSlug;
  readonly status: TransactionStatus;
  readonly payment_method: PaymentMethod;
  readonly completed_at: IsoDateTime;
}

/**
 * Expected local record shape used for webhook verification.
 */
export interface WebhookVerificationContext {
  /** The order-id the merchant is expecting for this webhook. */
  readonly expectedOrderId: OrderId;
  /** The amount (in IDR) the merchant expects. */
  readonly expectedAmount: AmountIDR;
  /** Optional project slug to enforce. */
  readonly expectedProject?: ProjectSlug;
}
