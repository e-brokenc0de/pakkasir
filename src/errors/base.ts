/**
 * The discriminant string identifying a concrete {@link PakasirError} subclass.
 *
 * Using a literal union (rather than e.g. `string`) lets consumers write
 * exhaustive `switch` statements that TypeScript will check for completeness.
 */
export type PakasirErrorKind = 'api' | 'network' | 'validation' | 'webhook';

/**
 * Abstract base class for every error thrown by the Pakasir SDK.
 *
 * Narrow on `kind` (a literal union) or use `instanceof` on any subclass.
 *
 * @example
 * ```ts
 * try {
 *   await client.transactions.detail({ ... });
 * } catch (err) {
 *   if (err instanceof PakasirError) {
 *     switch (err.kind) {
 *       case 'api':        // err is ApiError
 *       case 'network':    // err is NetworkError
 *       case 'validation': // err is ValidationError
 *       case 'webhook':    // err is WebhookVerificationError
 *     }
 *   }
 * }
 * ```
 */
export abstract class PakasirError extends Error {
  /** Discriminant for narrowing between subclasses without `instanceof`. */
  public abstract readonly kind: PakasirErrorKind;

  protected constructor(message: string, options?: { readonly cause?: unknown }) {
    super(message);
    this.name = new.target.name;
    if (options?.cause !== undefined) {
      // `Error.cause` is a standard ES2022 feature, but the typing on
      // `ErrorOptions` conflicts with `exactOptionalPropertyTypes`, so we
      // set it manually.
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }
    // Restore prototype chain when transpiled to ES5 targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
