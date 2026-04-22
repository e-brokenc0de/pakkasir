import { WebhookVerificationError } from '../../errors/webhook-error.js';
import { PAYMENT_METHODS } from '../../types/common.js';
import { isRecord } from '../../utils/assert.js';
import type { WebhookPayload, WebhookVerificationContext } from './types.js';

/**
 * Webhook domain module.
 *
 * Unlike the transaction modules, this does not make network calls — it
 * parses and verifies the payloads that Pakasir **sends** to the merchant.
 *
 * @remarks
 * Pakasir does not currently document an HMAC or JWT signature header on
 * webhook deliveries, so verification is content-based: the caller supplies
 * the expected `order_id` / `amount` / `project` from their own database and
 * `verify()` checks that the webhook payload matches.
 *
 * If Pakasir ever adds a signature header, it can be checked inside this
 * module without changing its public surface.
 */
export class WebhooksModule {
  /**
   * Parse a webhook body (string or pre-parsed JSON) into a typed payload.
   *
   * @throws {@link WebhookVerificationError} if the body is malformed.
   */
  public parse(rawBody: unknown): WebhookPayload {
    const rawString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody ?? null);
    const parsed: unknown = typeof rawBody === 'string' ? safeJsonParse(rawBody) : rawBody;

    if (!isWebhookPayload(parsed)) {
      throw new WebhookVerificationError(
        'Webhook payload does not match the expected Pakasir schema.',
        { rawBody: rawString },
      );
    }
    return parsed;
  }

  /**
   * Parse and verify that a webhook payload matches a local record.
   *
   * Compares `amount`, `order_id`, and (if provided) `project` against the
   * values the merchant expects.
   *
   * @throws {@link WebhookVerificationError} if parsing fails or any expected
   *   field does not match.
   */
  public verify(rawBody: unknown, context: WebhookVerificationContext): WebhookPayload {
    const payload = this.parse(rawBody);
    const rawString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody ?? null);

    if (payload.order_id !== context.expectedOrderId) {
      throw new WebhookVerificationError(
        `Webhook order_id "${payload.order_id}" does not match expected "${context.expectedOrderId}".`,
        { rawBody: rawString },
      );
    }
    if (payload.amount !== context.expectedAmount) {
      throw new WebhookVerificationError(
        `Webhook amount ${payload.amount} does not match expected ${context.expectedAmount}.`,
        { rawBody: rawString },
      );
    }
    if (context.expectedProject !== undefined && payload.project !== context.expectedProject) {
      throw new WebhookVerificationError(
        `Webhook project "${payload.project}" does not match expected "${context.expectedProject}".`,
        { rawBody: rawString },
      );
    }
    return payload;
  }

  /**
   * Convenience predicate — true when the payment completed successfully.
   */
  public isPaymentSuccess(payload: WebhookPayload): boolean {
    return payload.status === 'completed';
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function isWebhookPayload(value: unknown): value is WebhookPayload {
  if (!isRecord(value)) return false;
  const paymentMethod = value.payment_method;
  return (
    typeof value.amount === 'number' &&
    typeof value.order_id === 'string' &&
    typeof value.project === 'string' &&
    typeof value.status === 'string' &&
    typeof paymentMethod === 'string' &&
    PAYMENT_METHODS.includes(paymentMethod as never) &&
    typeof value.completed_at === 'string'
  );
}
