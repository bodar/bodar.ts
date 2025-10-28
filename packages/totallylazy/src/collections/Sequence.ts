/** @module Lazy sequence type with functional operations */
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

/** Creates a Sequence from the given iterable and transducers  */
export function sequence<A>(a: Iterable<A>): Sequence<A>;
/** Creates a Sequence from the given iterable and transducers  */
export function sequence<A, B>(a: Iterable<A>, b: Transducer<A, B>): Sequence<B>;
/** Creates a Sequence from the given iterable and transducers  */
export function sequence<A, B, C>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): Sequence<C>;
/** Creates a Sequence from the given iterable and transducers  */
export function sequence<A, B, C, D>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): Sequence<D>;
/** Creates a Sequence from the given iterable and transducers  */
export function sequence<A, B, C, D, E>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): Sequence<E>;
/** Creates a Sequence from the given iterable and transducers  */
export function sequence<A, B, C, D, E, F>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): Sequence<F>;
/** Creates a Sequence from the given iterable and transducers  */
export function sequence(source: Iterable<any>, ...transducers: readonly Transducer<any, any>[]): Sequence<any> ;
export function sequence(source: Iterable<any>, ...transducers: readonly Transducer<any, any>[]): Sequence<any> {
    if (source instanceof Sequence) {
        return new Sequence(source.source, flatten([...source.transducers, ...transducers]));
    }
    return new Sequence(source, flatten(transducers));
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
