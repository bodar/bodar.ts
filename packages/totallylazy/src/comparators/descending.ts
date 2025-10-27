/**
 * A comparator that sorts values in descending order (largest to smallest).
 *
 * @example
 * ```ts
 * [1, 2, 3].sort(descending); // [3, 2, 1]
 * ```
 */
export function descending<T>(a: T, b: T): number {
    if (a < b) return 1;
    if (a > b) return -1;
    return 0;
}