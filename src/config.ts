import { ValidationError } from './errors/validation-error.js';
import type { HttpTransport } from './http/transport.js';
import type { ProjectSlug } from './types/common.js';

/**
 * Default Pakasir production base URL.
 */
export const DEFAULT_BASE_URL = 'https://app.pakasir.com';

/**
 * Default per-request timeout.
 */
export const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * User-facing configuration passed to {@link PakasirClient}.
 *
 * All fields except `apiKey` and `project` are optional; sensible defaults
 * are filled in by {@link resolveConfig}.
 */
export interface PakasirConfig {
  /** Pakasir API key. Obtained from the Project detail page. */
  readonly apiKey?: string;
  /** Default project slug used when a call does not specify one. */
  readonly project?: ProjectSlug;
  /** Override the base URL (e.g. for self-hosted testing). */
  readonly baseUrl?: string;
  /** Per-request timeout in milliseconds. Set to `0` to disable. */
  readonly timeoutMs?: number;
  /** Custom headers merged into every request. */
  readonly defaultHeaders?: Readonly<Record<string, string>>;
  /** Inject a custom HTTP transport (e.g. for tests or retry middleware). */
  readonly transport?: HttpTransport;
  /** Override the `fetch` implementation used by the default transport. */
  readonly fetch?: typeof globalThis.fetch;
}

/**
 * Fully-resolved configuration — every field present.
 *
 * `transport` and `fetch` remain optional because they are "presence-or-
 * absence" flags rather than defaulted values.
 */
export interface ResolvedConfig {
  readonly apiKey: string;
  readonly project: ProjectSlug;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly defaultHeaders: Readonly<Record<string, string>>;
  readonly transport?: HttpTransport;
  readonly fetch?: typeof globalThis.fetch;
}

/**
 * Resolve and validate a {@link PakasirConfig}, filling in defaults and
 * reading `PAKASIR_API_KEY` / `PAKASIR_PROJECT` from `process.env` as
 * fallbacks.
 *
 * @throws {@link ValidationError} if required fields are missing.
 */
export function resolveConfig(config: PakasirConfig): ResolvedConfig {
  const env = readEnv();
  const apiKey = config.apiKey ?? env.PAKASIR_API_KEY;
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    throw new ValidationError(
      'Pakasir `apiKey` is required (pass `config.apiKey` or set PAKASIR_API_KEY).',
      { field: 'apiKey' },
    );
  }
  const project = config.project ?? env.PAKASIR_PROJECT;
  if (typeof project !== 'string' || project.length === 0) {
    throw new ValidationError(
      'Pakasir `project` is required (pass `config.project` or set PAKASIR_PROJECT).',
      { field: 'project' },
    );
  }

  const resolved: ResolvedConfig = {
    apiKey,
    project,
    baseUrl: (config.baseUrl ?? env.PAKASIR_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    defaultHeaders: config.defaultHeaders ?? {},
    ...(config.transport !== undefined ? { transport: config.transport } : {}),
    ...(config.fetch !== undefined ? { fetch: config.fetch } : {}),
  };
  return resolved;
}

interface PakasirEnv {
  readonly PAKASIR_API_KEY?: string;
  readonly PAKASIR_PROJECT?: string;
  readonly PAKASIR_BASE_URL?: string;
}

/**
 * Read the three recognised environment variables without requiring
 * `@types/node` everywhere. Never throws; returns an empty object when
 * `process` is unavailable.
 */
function readEnv(): PakasirEnv {
  const proc: unknown = (
    globalThis as { process?: { env?: Readonly<Record<string, string | undefined>> } }
  ).process;
  if (typeof proc !== 'object' || proc === null || !('env' in proc)) {
    return {};
  }
  const envRecord = (proc as { env?: Readonly<Record<string, string | undefined>> }).env;
  if (envRecord === undefined) {
    return {};
  }
  const out: {
    PAKASIR_API_KEY?: string;
    PAKASIR_PROJECT?: string;
    PAKASIR_BASE_URL?: string;
  } = {};
  if (typeof envRecord.PAKASIR_API_KEY === 'string')
    out.PAKASIR_API_KEY = envRecord.PAKASIR_API_KEY;
  if (typeof envRecord.PAKASIR_PROJECT === 'string')
    out.PAKASIR_PROJECT = envRecord.PAKASIR_PROJECT;
  if (typeof envRecord.PAKASIR_BASE_URL === 'string')
    out.PAKASIR_BASE_URL = envRecord.PAKASIR_BASE_URL;
  return out;
}
