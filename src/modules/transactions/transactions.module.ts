import { RequestBuilder } from '../../http/request.js';
import type { HttpTransport } from '../../http/transport.js';
import { PAYMENT_METHODS } from '../../types/common.js';
import type { ProjectSlug } from '../../types/common.js';
import type { JsonObject } from '../../types/utility.js';
import { ValidationError } from '../../errors/validation-error.js';
import { assertNonEmptyString, assertPositiveInteger, isRecord } from '../../utils/assert.js';
import type {
  TransactionCancelInput,
  TransactionCancelResponse,
  TransactionCreateInput,
  TransactionCreateResponse,
  TransactionDetailInput,
  TransactionDetailResponse,
  TransactionPayment,
  TransactionRecord,
} from './types.js';

/**
 * Dependencies the module needs to function — injected by the client.
 */
export interface TransactionsModuleDeps {
  readonly transport: HttpTransport;
  /** Default project slug, used when input does not specify one. */
  readonly defaultProject: ProjectSlug;
}

/**
 * Transactions domain module.
 *
 * Covers the three real Pakasir transaction endpoints:
 *   - `POST /api/transactioncreate/{method}`
 *   - `POST /api/transactioncancel`
 *   - `GET  /api/transactiondetail`
 */
export class TransactionsModule {
  readonly #transport: HttpTransport;
  readonly #defaultProject: ProjectSlug;

  public constructor(deps: TransactionsModuleDeps) {
    this.#transport = deps.transport;
    this.#defaultProject = deps.defaultProject;
  }

  /**
   * Create a new transaction.
   *
   * @example
   * ```ts
   * const { payment } = await client.transactions.create({
   *   method: 'qris',
   *   orderId: 'INV-001',
   *   amount: 15_000,
   * });
   * console.log(payment.payment_number); // QRIS string or VA number
   * ```
   */
  public async create(input: TransactionCreateInput): Promise<TransactionCreateResponse> {
    validatePaymentMethod(input.method);
    assertNonEmptyString(input.orderId, 'orderId');
    assertPositiveInteger(input.amount, 'amount');

    const project = input.project ?? this.#defaultProject;
    assertNonEmptyString(project, 'project');

    const body: JsonObject = {
      project,
      order_id: input.orderId,
      amount: input.amount,
    };

    return new RequestBuilder<TransactionCreateResponse>(
      this.#transport,
      'POST',
      `/api/transactioncreate/${input.method}`,
      isTransactionCreateResponse,
    )
      .withBody(body)
      .send();
  }

  /**
   * Cancel a pending transaction.
   */
  public async cancel(input: TransactionCancelInput): Promise<TransactionCancelResponse> {
    assertNonEmptyString(input.orderId, 'orderId');
    assertPositiveInteger(input.amount, 'amount');
    const project = input.project ?? this.#defaultProject;
    assertNonEmptyString(project, 'project');

    const body: JsonObject = {
      project,
      order_id: input.orderId,
      amount: input.amount,
    };

    return new RequestBuilder<TransactionCancelResponse>(
      this.#transport,
      'POST',
      '/api/transactioncancel',
      isTransactionCancelResponse,
    )
      .withBody(body)
      .send();
  }

  /**
   * Fetch the current state of a transaction.
   */
  public async detail(input: TransactionDetailInput): Promise<TransactionDetailResponse> {
    assertNonEmptyString(input.orderId, 'orderId');
    assertPositiveInteger(input.amount, 'amount');
    const project = input.project ?? this.#defaultProject;
    assertNonEmptyString(project, 'project');

    return new RequestBuilder<TransactionDetailResponse>(
      this.#transport,
      'GET',
      '/api/transactiondetail',
      isTransactionDetailResponse,
    )
      .withQuery({
        project,
        order_id: input.orderId,
        amount: input.amount,
      })
      .send();
  }
}

function validatePaymentMethod(method: unknown): void {
  if (typeof method !== 'string' || !PAYMENT_METHODS.includes(method as never)) {
    throw new ValidationError(
      `Unknown payment method: "${String(method)}". Expected one of ${PAYMENT_METHODS.join(', ')}.`,
      { field: 'method' },
    );
  }
}

function isTransactionPayment(value: unknown): value is TransactionPayment {
  if (!isRecord(value)) return false;
  return (
    typeof value.project === 'string' &&
    typeof value.order_id === 'string' &&
    typeof value.amount === 'number' &&
    typeof value.fee === 'number' &&
    typeof value.total_payment === 'number' &&
    typeof value.payment_method === 'string' &&
    typeof value.payment_number === 'string' &&
    typeof value.expired_at === 'string'
  );
}

function isTransactionRecord(value: unknown): value is TransactionRecord {
  if (!isRecord(value)) return false;
  const completedAt = value.completed_at;
  return (
    typeof value.amount === 'number' &&
    typeof value.order_id === 'string' &&
    typeof value.project === 'string' &&
    typeof value.status === 'string' &&
    typeof value.payment_method === 'string' &&
    (completedAt === null || typeof completedAt === 'string')
  );
}

function isTransactionCreateResponse(value: unknown): value is TransactionCreateResponse {
  return isRecord(value) && isTransactionPayment(value.payment);
}

function isTransactionDetailResponse(value: unknown): value is TransactionDetailResponse {
  return isRecord(value) && isTransactionRecord(value.transaction);
}

function isTransactionCancelResponse(value: unknown): value is TransactionCancelResponse {
  if (!isRecord(value)) return false;
  const tx = value.transaction;
  const success = value.success;
  const message = value.message;
  return (
    (tx === undefined || isTransactionRecord(tx)) &&
    (success === undefined || typeof success === 'boolean') &&
    (message === undefined || typeof message === 'string')
  );
}
