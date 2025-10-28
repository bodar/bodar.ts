/** @module Ascending order comparator */
/**
 * A comparator that sorts values in ascending order (smallest to largest).
 *
 * @example
 * ```ts
 * [3, 1, 2].sort(ascending); // [1, 2, 3]
 * ```
 */
export function ascending<T>(a: T, b: T): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}