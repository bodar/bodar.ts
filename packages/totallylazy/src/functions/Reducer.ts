/** @module Reducer function type */

/**
 * A function that reduces values to an accumulator
 */
export interface Reducer<A, B> {
    (accumulator: B, value: A): B;
    toString(): string;
}
