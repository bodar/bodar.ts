import {Transducer} from "../transducers/Transducer.ts";
import {flatten} from "../transducers/CompositeTransducer.ts";

/**
 * A Sequence is an Iterable that is composed of a source Iterable and a set of Transducers
 *
 * Compared to a normal Iterable like an Array, a Sequence is lazy and composable. This means that
 * it will only evaluate the source Iterable when it is iterated over, and that no intermediate
 * objects like arrays are created when applying multiple transformations.
 */
export class Sequence<T> implements Iterable<T> {
    constructor(public readonly source: Iterable<any>,
                public readonly transducers: readonly Transducer<any, any>[]) {
    }

    [Symbol.iterator](): Iterator<T> {
        return this.transducers.reduce((r, v) => v(r), this.source)[Symbol.iterator]();
    }

    toString(): string {
        return `sequence(${this.source}, ${this.transducers})`;
    }
}

/**
 * Creates a Sequence from the given iterable and transducers
 *
 * @example
 * ```typescript
 * import { sequence } from "@bodar/totallylazy/collections/Sequence.ts";
 * import { filter } from "@bodar/totallylazy/transducers/FilterTransducer.ts";
 * import { map } from "@bodar/totallylazy/transducers/MapTransducer.ts";
 *
 * const numbers = [1, 2, 3, 4, 5];
 * const result = sequence(
 *   numbers,
 *   filter((x: number) => x % 2 === 0),
 *   map(String)
 * );
 * Array.from(result); // ['2', '4']
 * ```
 */
// Helper type to extract the first element type
type Head<T extends any[]> = T extends [infer H, ...any] ? H : never;

// Recursive type to validate transducer chaining
type ValidateTransducers<
    T extends Transducer<any, any>[],
    Cache extends Transducer<any, any>[] = []
> = T extends []
    ? Cache
    : T extends [infer Last]
        ? Last extends Transducer<any, any>
            ? [...Cache, Last]
            : never
        : T extends [infer First, ...infer Rest]
            ? First extends Transducer<infer _A, infer B>
                ? Rest extends Transducer<any, any>[]
                    ? Head<Rest> extends Transducer<infer C, any>
                        ? B extends C  // Output of First must match input of Next
                            ? ValidateTransducers<Rest, [...Cache, First]>
                            : never  // Type mismatch - compilation error
                        : never
                    : never
                : never
            : never;

// Extract the output type of the last transducer
type LastOutput<T extends Transducer<any, any>[]> =
    T extends [...any, Transducer<any, infer Z>] ? Z : never;

export function sequence<S, T extends Transducer<any, any>[]>(
    source: Iterable<S>, ...transducers: T & (ValidateTransducers<T> extends T ? unknown : never)): Sequence<LastOutput<T>> {
    if (source instanceof Sequence) {
        return new Sequence<any>(source.source, flatten([...source.transducers, ...transducers]));
    }
    return new Sequence<any>(source, flatten(transducers));
}

/**
 * Creates an infinite sequence by repeatedly applying a generator function to a value
 *
 * @example
 * ```ts
 * iterate(x => x + 1, 0); // Generates 0, 1, 2, 3, ...
 * ```
 */
export function* iterate<T>(generator: (t: T) => T, value: T): Iterable<T> {
    while (true) {
        yield value;
        value = generator(value);
    }
}

/**
 * Creates an infinite sequence by repeatedly calling a generator function
 *
 * @example
 * ```ts
 * repeat(() => Math.random()); // Generates infinite random numbers
 * ```
 */
export function* repeat<T>(generator: () => T): Iterable<T> {
    while (true) {
        yield generator();
    }
}
