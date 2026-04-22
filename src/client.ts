import { resolveConfig } from './config.js';
import type { PakasirConfig, ResolvedConfig } from './config.js';
import { FetchTransport } from './http/fetch-transport.js';
import type { HttpTransport } from './http/transport.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { WebhooksModule } from './modules/webhooks/webhooks.module.js';

/**
 * The main entry point for the Pakasir SDK.
 *
 * A `PakasirClient` owns:
 *   - a configured HTTP transport (default: `FetchTransport`),
 *   - one instance of each domain module.
 *
 * @example
 * ```ts
 * import { PakasirClient } from 'pakkasir';
 *
 * const client = new PakasirClient({
 *   apiKey: process.env.PAKASIR_API_KEY!,
 *   project: 'my-shop',
 * });
 *
 * const { payment } = await client.transactions.create({
 *   method: 'qris',
 *   orderId: 'INV-0001',
 *   amount: 15_000,
 * });
 * ```
 */
export class PakasirClient {
  /** Transactions API: create, cancel, detail. */
  public readonly transactions: TransactionsModule;
  /** Payments API: sandbox simulation. */
  public readonly payments: PaymentsModule;
  /** Webhooks API: parse + verify incoming webhook payloads. */
  public readonly webhooks: WebhooksModule;

  readonly #config: ResolvedConfig;
  readonly #transport: HttpTransport;

  public constructor(config: PakasirConfig = {}) {
    this.#config = resolveConfig(config);
    this.#transport = this.#config.transport ?? this.#buildDefaultTransport();

    const deps = {
      transport: this.#transport,
      defaultProject: this.#config.project,
    } as const;

    this.transactions = new TransactionsModule(deps);
    this.payments = new PaymentsModule(deps);
    this.webhooks = new WebhooksModule();
  }

  /** The base URL this client is configured to talk to. */
  public get baseUrl(): string {
    return this.#config.baseUrl;
  }

  /** The default project slug used when a call does not specify one. */
  public get project(): string {
    return this.#config.project;
  }

  /**
   * Expose the underlying transport so advanced users can build custom
   * middleware (retries, instrumentation, logging) on top of it.
   */
  public get transport(): HttpTransport {
    return this.#transport;
  }

  #buildDefaultTransport(): HttpTransport {
    return new FetchTransport({
      baseUrl: this.#config.baseUrl,
      apiKey: this.#config.apiKey,
      defaultHeaders: this.#config.defaultHeaders,
      timeoutMs: this.#config.timeoutMs,
      ...(this.#config.fetch !== undefined ? { fetch: this.#config.fetch } : {}),
    });
  }
}
