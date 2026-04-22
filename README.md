<h1 align="center">pakkasir</h1>

<p align="center">
  Fully-typed TypeScript SDK for the <a href="https://pakasir.com">Pakasir</a> payment gateway.
</p>

<p align="center">
  <a href="https://github.com/e-brokenc0de/pakkasir/actions/workflows/ci.yml"><img src="https://github.com/e-brokenc0de/pakkasir/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/pakkasir"><img src="https://img.shields.io/npm/v/pakkasir.svg" alt="npm version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/pakkasir.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/types-TypeScript-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node >= 18">
</p>

---

## Features

- **Fully typed.** Strict TypeScript, zero `any`, end-to-end response inference.
- **Zero runtime dependencies.** Uses the platform `fetch` available in Node 18+ and all modern browsers.
- **Clean architecture.** Injectable HTTP transport, discriminated error hierarchy, domain-oriented modules.
- **Tested.** 33+ unit tests covering happy paths, API errors, network failures, and schema validation.
- **Extensible.** Add new endpoints or custom middleware (retries, logging) without touching core code.

## Installation

```sh
pnpm add pakkasir
# or
npm install pakkasir
# or
yarn add pakkasir
```

> Requires Node.js **≥ 18** (for native `fetch`).

## Quick start

```ts
import { PakasirClient } from 'pakkasir';

const client = new PakasirClient({
  apiKey: process.env.PAKASIR_API_KEY!,
  project: 'my-shop',
});

// Create a QRIS transaction.
const { payment } = await client.transactions.create({
  method: 'qris',
  orderId: 'INV-0001',
  amount: 15_000,
});

console.log(payment.payment_number); // QRIS payload string
```

## Configuration

`PakasirClient` accepts the following options. All but `apiKey` and `project` have sensible defaults and can also be read from environment variables.

| Option           | Type                     | Default                   | Env var            |
| ---------------- | ------------------------ | ------------------------- | ------------------ |
| `apiKey`         | `string`                 | —                         | `PAKASIR_API_KEY`  |
| `project`        | `string`                 | —                         | `PAKASIR_PROJECT`  |
| `baseUrl`        | `string`                 | `https://app.pakasir.com` | `PAKASIR_BASE_URL` |
| `timeoutMs`      | `number`                 | `30_000`                  | —                  |
| `defaultHeaders` | `Record<string, string>` | `{}`                      | —                  |
| `transport`      | `HttpTransport`          | built-in `FetchTransport` | —                  |
| `fetch`          | `typeof fetch`           | `globalThis.fetch`        | —                  |

## Modules

### Transactions

```ts
// Create
await client.transactions.create({ method: 'qris', orderId, amount });

// Fetch current state
await client.transactions.detail({ orderId, amount });

// Cancel a pending transaction
await client.transactions.cancel({ orderId, amount });
```

Supported payment methods: `qris`, `bni_va`, `bri_va`, `cimb_niaga_va`, `maybank_va`, `permata_va`, `sampoerna_va`, `bnc_va`, `atm_bersama_va`, `artha_graha_va`.

### Payments

```ts
// Sandbox only: simulate a completed payment.
await client.payments.simulate({ method: 'bni_va', orderId, amount });
```

### Webhooks

```ts
// In your HTTP handler:
const payload = client.webhooks.verify(request.rawBody, {
  expectedOrderId: 'INV-0001',
  expectedAmount: 15_000,
  expectedProject: 'my-shop',
});

if (client.webhooks.isPaymentSuccess(payload)) {
  await fulfillOrder(payload.order_id);
}
```

### URL integration

```ts
import { buildPaymentRedirectUrl } from 'pakkasir';

const hostedUrl = buildPaymentRedirectUrl({
  project: 'my-shop',
  amount: 15_000,
  orderId: 'INV-0001',
  qrisOnly: true,
  redirectUrl: 'https://merchant.example.com/thanks',
});
```

## Error handling

Every error thrown by the SDK extends `PakasirError` and carries a `kind` discriminant:

```ts
import { PakasirError, ApiError, NetworkError, ValidationError } from 'pakkasir';

try {
  await client.transactions.create({ method: 'qris', orderId, amount });
} catch (err) {
  if (err instanceof PakasirError) {
    switch (err.kind) {
      case 'api':
        /* non-2xx HTTP response: err.status, err.body */ break;
      case 'network':
        /* transport failure: err.cause */ break;
      case 'validation':
        /* bad input / bad response shape */ break;
      case 'webhook':
        /* webhook verification failed */ break;
    }
  }
}
```

## Architecture

```
PakasirClient
  ├── transactions  ── TransactionsModule ──┐
  ├── payments      ── PaymentsModule      ─┤
  └── webhooks      ── WebhooksModule       │  (pure, no network)
                                            │
                         ┌──────────────────┘
                         ▼
                    HttpTransport  (interface)
                         │
                         └─► FetchTransport  (default impl)
```

The `HttpTransport` interface is the only seam that touches the network, making the SDK trivial to unit-test. Every module is pure and produces typed `HttpRequest` objects; the transport is responsible for auth injection, serialization, and error translation.

For a full walkthrough, read [`examples/usage.ts`](./examples/usage.ts).

## Development

```sh
pnpm install      # install dependencies
pnpm typecheck    # strict TypeScript check
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm test         # Vitest
pnpm test:coverage # with coverage report
pnpm build        # emit dist/
pnpm example      # run examples/usage.ts
```

## Contributing

Contributions are very welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) and our [Code of Conduct](./CODE_OF_CONDUCT.md) before opening a pull request.

For security issues, please follow the process described in [SECURITY.md](./SECURITY.md) instead of opening a public issue.

## Versioning

This project follows [Semantic Versioning 2.0](https://semver.org/). Releases are fully automated by [semantic-release](https://github.com/semantic-release/semantic-release): every push to `main` is analyzed, the next version is computed from Conventional Commit types (`fix:` → patch, `feat:` → minor, `feat!:` → major), and `CHANGELOG.md`, Git tags, the GitHub Release, and the npm publication are all produced in one shot.

See [CHANGELOG.md](./CHANGELOG.md) for release notes.

## License

[MIT](./LICENSE) © pakkasir contributors
