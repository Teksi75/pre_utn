/**
 * Result type — discriminated union for success/error without exceptions.
 * No external dependencies. Pure TypeScript.
 */

/** Success result containing a value. */
export type Ok<T> = { readonly ok: true; readonly value: T };

/** Error result containing an error. */
export type Err<E> = { readonly ok: false; readonly error: E };

/** Discriminated union of success or error. */
export type Result<T, E> = Ok<T> | Err<E>;

/** Create a success result wrapping the given value. */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/** Create an error result wrapping the given error. */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/** Type guard: returns true if the result is a success. */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/** Type guard: returns true if the result is an error. */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}
