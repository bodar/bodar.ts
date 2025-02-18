import {Transducer} from "../transducers/Transducer.ts";
import {sequence} from "./Sequence.ts";

export function single<A>(iterable: Iterable<A>): A
export function single<A, B>(a: Iterable<A>, b: Transducer<A, B>): B;
export function single<A, B, C>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): C;
export function single<A, B, C, D>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>): D;
export function single<A, B, C, D, E>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>): E;
export function single<A, B, C, D, E, F>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>, d: Transducer<C, D>, e: Transducer<D, E>, f: Transducer<E, F>): F;
export function single(source: Iterable<any>, ...transducers: readonly Transducer<any, any>[]): any ;
export function single(source: Iterable<any>, ...transducers: readonly Transducer<any, any>[]): any {
    return toSingle(sequence(source, ...transducers));
}

function toSingle<A>(iterable: Iterable<A>): A {
    for (const a of iterable) return a;
    throw new Error("Expected a single value");
}