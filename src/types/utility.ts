/**
 * Generic utility types used throughout the SDK.
 *
 * None of these reference `any`; they rely on `unknown` for safety.
 */

/**
 * Recursively mark every property of `T` as `readonly`.
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T[K] extends object
      ? DeepReadonly<T[K]>
      : T[K];
};

/**
 * Replace the type of a single key `K` in `T` with `V`.
 */
export type Replace<T, K extends keyof T, V> = Omit<T, K> & Record<K, V>;

/**
 * Require at least one of the keys in `K` to be present on `T`.
 */
export type RequireAtLeastOne<T, K extends keyof T = keyof T> = T &
  { [P in K]-?: Required<Pick<T, P>> }[K];

/**
 * A tagged, branded primitive — compile-time distinct from its base type.
 *
 * @example
 * type UserId = Brand<string, 'UserId'>;
 */
export type Brand<TBase, TTag extends string> = TBase & {
  readonly __brand: TTag;
};

/**
 * A success/failure union used by helpers that prefer not to throw.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Serializable JSON value — the output of `JSON.parse` typed safely.
 *
 * Used anywhere the SDK needs to round-trip an unknown but structured payload
 * without reaching for `any`.
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = Record<string, JsonValue>;
