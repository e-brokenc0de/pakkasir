import type { AmountIDR, OrderId, PaymentMethod, ProjectSlug } from '../../types/common.js';

/**
 * Input for {@link PaymentsModule.simulate}.
 *
 * Used in Sandbox mode to simulate a successful payment — fires the webhook
 * just as a real completion would.
 */
export interface PaymentSimulationInput {
  readonly method: PaymentMethod;
  readonly orderId: OrderId;
  readonly amount: AmountIDR;
  readonly project?: ProjectSlug;
}

/**
 * Response from {@link PaymentsModule.simulate}.
 *
 * The Pakasir docs don't fully specify the shape of the simulation response;
 * this captures the common success/message shape while remaining permissive.
 */
export interface PaymentSimulationResponse {
  readonly success?: boolean;
  readonly message?: string;
}
