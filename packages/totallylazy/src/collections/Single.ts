/**
 * @module
 *
 * Extract a single value from an iterable with optional transducer transformations.
 */

import {Transducer} from "../transducers/Transducer.ts";
import {sequence} from "./Sequence.ts";

/** Extracts the first value from an iterable, optionally applying transducers. Throws an error if the iterable is empty. */
export function single<A>(iterable: Iterable<A>): A
/** Extracts the first value from an iterable, optionally applying transducers. Throws an error if the iterable is empty. */
export function single<A, B>(a: Iterable<A>, b: Transducer<A, B>): B;
/** Extracts the first value from an iterable, optionally applying transducers. Throws an error if the iterable is empty. */
export function single<A, B, C>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): C;
/** Extracts the first value from an iterable, optionally applying transducers. Throws an error if the iterable is empty. */
export function single<A, B, C, D>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): D;
/** Extracts the first value from an iterable, optionally applying transducers. Throws an error if the iterable is empty. */
export function single<A, B, C, D, E>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): E;
/** Extracts the first value from an iterable, optionally applying transducers. Throws an error if the iterable is empty. */
export function single<A, B, C, D, E, F>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): F;
/** Extracts the first value from an iterable, optionally applying transducers. Throws an error if the iterable is empty. */
export function single(source: Iterable<any>, ...transducers: readonly Transducer<any, any>[]): any ;
/** Extracts the first value from an iterable, optionally applying transducers. Throws an error if the iterable is empty. */
export function single(source: Iterable<any>, ...transducers: readonly Transducer<any, any>[]): any {
    return toSingle(sequence(source, ...transducers));
}

function toSingle<A>(iterable: Iterable<A>): A {
    for (const a of iterable) return a;
    throw new Error("Expected a single value");
}