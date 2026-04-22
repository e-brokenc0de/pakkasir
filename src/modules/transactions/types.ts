import type {
  AmountIDR,
  IsoDateTime,
  OrderId,
  PaymentMethod,
  ProjectSlug,
  TransactionStatus,
} from '../../types/common.js';

/**
 * Input for {@link TransactionsModule.create}.
 *
 * `project` is optional — the client-level default is used when omitted.
 */
export interface TransactionCreateInput {
  /** Payment method identifier (determines which virtual-account issuer is used). */
  readonly method: PaymentMethod;
  /** Merchant-side order identifier. Must be unique per transaction. */
  readonly orderId: OrderId;
  /** Payment amount in IDR (integer, no cents). */
  readonly amount: AmountIDR;
  /** Override the project slug configured on the client. */
  readonly project?: ProjectSlug;
}

/**
 * Payment detail returned from {@link TransactionsModule.create}.
 */
export interface TransactionPayment {
  readonly project: ProjectSlug;
  readonly order_id: OrderId;
  readonly amount: AmountIDR;
  readonly fee: number;
  readonly total_payment: number;
  readonly payment_method: PaymentMethod;
  /** Virtual-account number or QRIS code, depending on `payment_method`. */
  readonly payment_number: string;
  readonly expired_at: IsoDateTime;
}

/**
 * Raw response shape for {@link TransactionsModule.create}, matching the
 * server payload 1:1.
 */
export interface TransactionCreateResponse {
  readonly payment: TransactionPayment;
}

/**
 * Input for {@link TransactionsModule.cancel}.
 */
export interface TransactionCancelInput {
  readonly orderId: OrderId;
  readonly amount: AmountIDR;
  readonly project?: ProjectSlug;
}

/**
 * Input for {@link TransactionsModule.detail}.
 */
export interface TransactionDetailInput {
  readonly orderId: OrderId;
  readonly amount: AmountIDR;
  readonly project?: ProjectSlug;
}

/**
 * Transaction record returned by the Pakasir API.
 */
export interface TransactionRecord {
  readonly amount: AmountIDR;
  readonly order_id: OrderId;
  readonly project: ProjectSlug;
  readonly status: TransactionStatus;
  readonly payment_method: PaymentMethod;
  readonly completed_at: IsoDateTime | null;
}

/**
 * Raw response shape for {@link TransactionsModule.detail}.
 */
export interface TransactionDetailResponse {
  readonly transaction: TransactionRecord;
}

/**
 * Raw response shape for {@link TransactionsModule.cancel}.
 *
 * The Pakasir docs do not fully specify the cancel response body; this type
 * captures the observable fields and leaves room for additional keys.
 */
export interface TransactionCancelResponse {
  readonly transaction?: TransactionRecord;
  readonly success?: boolean;
  readonly message?: string;
}
