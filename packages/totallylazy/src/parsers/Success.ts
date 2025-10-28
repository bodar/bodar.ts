/** @module Successful parse result type */
import type {Result} from "./Result.ts";
import type {View} from "./View.ts";

/**
 * Represents a successful parse result with the parsed value and remaining input
 */
export class Success<A, B> implements Result<A, B> {
    constructor(public value: B, public remainder: View<A>) {
    }

    * [Symbol.iterator](): Iterator<B> {
        yield this.value;
    }

    toString(): string {
        return `Success(${this.value}, ${this.remainder.toSource()})`;
    }
}

/**
 * Creates a successful parse result
 *
 * @example
 * ```ts
 * success("parsed", remaining); // Success with value and remaining input
 * ```
 */
export function success<A, B>(value: B, remainder: View<A>): Result<A, B> {
    return new Success(value, remainder);
}