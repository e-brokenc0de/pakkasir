/**
 * Example demonstrating end-to-end type inference with the Pakasir SDK.
 *
 * Run with:
 *   pnpm example
 *
 * This file does not hit the real network — it injects a mock transport so
 * the example can run unattended in CI. Every variable is annotated with its
 * inferred type in a comment so you can verify the types match your IDE's.
 */

import {
  PakasirClient,
  buildPaymentRedirectUrl,
  type HttpRequest,
  type HttpResponse,
  type HttpTransport,
  type TransactionCreateResponse,
  type TransactionDetailResponse,
  type WebhookPayload,
} from '../src/index.js';

/**
 * A tiny in-example transport that returns canned success responses.
 * In real code you would omit `transport` entirely and the SDK would use
 * the default `FetchTransport`.
 */
class InMemoryTransport implements HttpTransport {
  public constructor(private readonly responses: readonly unknown[]) {}
  private cursor = 0;

  // eslint-disable-next-line @typescript-eslint/require-await -- interface requires Promise return; no I/O is performed.
  public async send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const body = this.responses[this.cursor++];
    if (body === undefined) {
      throw new Error(`No stub response for ${request.method} ${request.path}`);
    }
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: body as T,
      rawBody: JSON.stringify(body),
    };
  }
}

async function main(): Promise<void> {
  const transport = new InMemoryTransport([
    {
      payment: {
        project: 'my-shop',
        order_id: 'INV-001',
        amount: 15_000,
        fee: 500,
        total_payment: 15_500,
        payment_method: 'qris',
        payment_number: '00020101021226...',
        expired_at: '2026-04-23T00:00:00.000Z',
      },
    },
    {
      transaction: {
        amount: 15_000,
        order_id: 'INV-001',
        project: 'my-shop',
        status: 'completed',
        payment_method: 'qris',
        completed_at: '2026-04-22T10:00:00.000Z',
      },
    },
  ]);

  const client = new PakasirClient({
    apiKey: 'demo-key',
    project: 'my-shop',
    transport,
  });

  // Inferred: TransactionCreateResponse
  const created: TransactionCreateResponse = await client.transactions.create({
    method: 'qris',
    orderId: 'INV-001',
    amount: 15_000,
  });
  console.log('payment_number =', created.payment.payment_number);

  // Inferred: TransactionDetailResponse
  const detail: TransactionDetailResponse = await client.transactions.detail({
    orderId: 'INV-001',
    amount: 15_000,
  });
  console.log('status =', detail.transaction.status);

  // URL integration helper — no network call.
  const hostedUrl: string = buildPaymentRedirectUrl({
    project: 'my-shop',
    amount: 15_000,
    orderId: 'INV-001',
    qrisOnly: true,
  });
  console.log('hosted URL =', hostedUrl);

  // Webhook verification (imagine this is your HTTP handler).
  const incomingBody = JSON.stringify({
    amount: 15_000,
    order_id: 'INV-001',
    project: 'my-shop',
    status: 'completed',
    payment_method: 'qris',
    completed_at: '2026-04-22T10:00:00.000Z',
  });
  const verified: WebhookPayload = client.webhooks.verify(incomingBody, {
    expectedOrderId: 'INV-001',
    expectedAmount: 15_000,
    expectedProject: 'my-shop',
  });
  console.log('verified =', client.webhooks.isPaymentSuccess(verified));
}

main().catch((err: unknown) => {
  console.error(err);
  const code = (globalThis as { process?: { exit?: (n: number) => void } }).process;
  code?.exit?.(1);
});
