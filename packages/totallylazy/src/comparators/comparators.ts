/** @module Comparator utilities and combinators */
import type {Comparator} from "./Comparator.ts";

/**
 * Combines multiple comparators into a single comparator that applies them in order until a non-zero result is found.
 * Useful for multi-level sorting (e.g., sort by lastName, then by firstName).
 */
export function comparators<T>(...comparators: Comparator<T>[]): Comparator<T> {
    return (a, b) => {
        for (const comparator of comparators) {
            const result = comparator(a, b);
            if (result != 0) return result;
        }
        return 0;
    }
}