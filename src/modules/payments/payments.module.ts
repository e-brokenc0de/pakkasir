import { RequestBuilder } from '../../http/request.js';
import type { HttpTransport } from '../../http/transport.js';
import { PAYMENT_METHODS } from '../../types/common.js';
import type { ProjectSlug } from '../../types/common.js';
import type { JsonObject } from '../../types/utility.js';
import { ValidationError } from '../../errors/validation-error.js';
import { assertNonEmptyString, assertPositiveInteger, isRecord } from '../../utils/assert.js';
import type { PaymentSimulationInput, PaymentSimulationResponse } from './types.js';

export interface PaymentsModuleDeps {
  readonly transport: HttpTransport;
  readonly defaultProject: ProjectSlug;
}

/**
 * Payments domain module — sandbox payment simulation.
 *
 * Backed by `POST /api/paymentsimulation`.
 */
export class PaymentsModule {
  readonly #transport: HttpTransport;
  readonly #defaultProject: ProjectSlug;

  public constructor(deps: PaymentsModuleDeps) {
    this.#transport = deps.transport;
    this.#defaultProject = deps.defaultProject;
  }

  /**
   * Trigger a sandbox payment simulation for an existing transaction.
   *
   * This will fire the merchant's configured webhook as if the payment had
   * been completed by an end user.
   */
  public async simulate(input: PaymentSimulationInput): Promise<PaymentSimulationResponse> {
    if (!PAYMENT_METHODS.includes(input.method)) {
      throw new ValidationError(`Unknown payment method: "${input.method}".`, {
        field: 'method',
      });
    }
    assertNonEmptyString(input.orderId, 'orderId');
    assertPositiveInteger(input.amount, 'amount');
    const project = input.project ?? this.#defaultProject;
    assertNonEmptyString(project, 'project');

    const body: JsonObject = {
      project,
      order_id: input.orderId,
      amount: input.amount,
      payment_method: input.method,
    };

    return new RequestBuilder<PaymentSimulationResponse>(
      this.#transport,
      'POST',
      '/api/paymentsimulation',
      isPaymentSimulationResponse,
    )
      .withBody(body)
      .send();
  }
}

function isPaymentSimulationResponse(value: unknown): value is PaymentSimulationResponse {
  if (!isRecord(value)) return false;
  const success = value.success;
  const message = value.message;
  return (
    (success === undefined || typeof success === 'boolean') &&
    (message === undefined || typeof message === 'string')
  );
}
