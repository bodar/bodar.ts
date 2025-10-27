/**
 * @module
 *
 * Array type utilities and helper functions for working with arrays and async iterables.
 */

/** Type representing a mutable array that contains values of type B extracted from union A | B */
export type ArrayContains<A, B> = Extract<A | B, B>[];

/** Type representing a readonly array that contains values of type B extracted from union A | B */
export type ReadonlyArrayContains<A, B> = readonly Extract<A | B, B>[];

// export type Head<T extends any[]> = T extends [infer HEAD, ...infer IGNORE] ? HEAD : never;
// export type Tail<T extends any[]> = T extends [infer IGNORE, ...infer TAIL] ? TAIL : never;

// export type Init<T extends any[]> = T extends [...infer INIT, any] ? INIT : never;
// export type Last<T extends any[]> = T extends [...infer IGNORE, infer LAST] ? LAST : never;

/** Converts an async iterable to a Promise that resolves to an array of all values */
export async function toPromiseArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const value of iterable) result.push(value);
    return result;
}
