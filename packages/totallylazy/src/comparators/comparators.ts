import type {Comparator} from "./Comparator.ts";

/**
 * Combines multiple comparators into a single comparator that applies them in order until a non-zero result is found.
 * Useful for multi-level sorting (e.g., sort by lastName, then by firstName).
 *
 * @example
 * ```ts
 * const people = [{name: 'Alice', age: 30}, {name: 'Bob', age: 30}, {name: 'Alice', age: 25}];
 * people.sort(comparators(by('name'), by('age'))); // Alice 25, Alice 30, Bob 30
 * ```
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