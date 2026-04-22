/**
 * pakkasir — Fully-typed TypeScript SDK for the Pakasir payment gateway.
 *
 * Public surface: the client plus every public type and error.
 */

export { PakasirClient } from './client.js';
export { resolveConfig, DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS } from './config.js';
export type { PakasirConfig, ResolvedConfig } from './config.js';

export {
  ApiError,
  NetworkError,
  PakasirError,
  ValidationError,
  WebhookVerificationError,
} from './errors/index.js';
export type { ApiErrorDetails, PakasirErrorKind } from './errors/index.js';

export { FetchTransport, RequestBuilder } from './http/index.js';
export type {
  FetchTransportOptions,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  HttpTransport,
  QueryParams,
  RawHttpResponse,
  ResponseGuard,
} from './http/index.js';

export { TransactionsModule } from './modules/transactions/index.js';
export type {
  TransactionCancelInput,
  TransactionCancelResponse,
  TransactionCreateInput,
  TransactionCreateResponse,
  TransactionDetailInput,
  TransactionDetailResponse,
  TransactionPayment,
  TransactionRecord,
  TransactionsModuleDeps,
} from './modules/transactions/index.js';

export { PaymentsModule } from './modules/payments/index.js';
export type {
  PaymentSimulationInput,
  PaymentSimulationResponse,
  PaymentsModuleDeps,
} from './modules/payments/index.js';

export { WebhooksModule } from './modules/webhooks/index.js';
export type { WebhookPayload, WebhookVerificationContext } from './modules/webhooks/index.js';

export { PAYMENT_METHODS } from './types/common.js';
export type {
  AmountIDR,
  IsoDateTime,
  OrderId,
  PaymentMethod,
  ProjectSlug,
  TransactionStatus,
} from './types/common.js';
export type {
  Brand,
  DeepReadonly,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  Replace,
  RequireAtLeastOne,
  Result,
} from './types/utility.js';

export { buildPaymentRedirectUrl } from './utils/url.js';
export type { PaymentRedirectInput } from './utils/url.js';
