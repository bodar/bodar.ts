import type {View} from "./View.ts";
import {Transducer} from "../transducers/Transducer.ts";
import {single} from "../collections/Single.ts";
import {Failure} from "./Failure.ts";
import { lazy } from "../functions/lazy.ts";

export interface Result<A, B> extends Iterable<B> {
    value: B;
    remainder: View<A>;
}

export class TransducingResult<A, B> implements Result<A, B> {
    constructor(public readonly source: Result<any, any>,
                public readonly transducers: readonly Transducer<any, any>[]) {
    }

    @lazy get value(): B {
        return single(this.source, ...this.transducers);
    }

    get remainder(): View<A> {
        return this.source.remainder;
    }

    * [Symbol.iterator](): Iterator<B> {
        yield this.value;
    }
}

export function result<A, B>(a: Result<A, B>): Result<A, B>;
export function result<A, B, C>(a: Result<A, B>, b: Transducer<B, C>): Result<A, C>;
export function result<A, B, C, D>(a: Result<A, B>, b: Transducer<B, C>, c: Transducer<C, D>): Result<A, D>;
export function result<A, B, C, D, E>(a: Result<A, B>, b: Transducer<B, C>, c: Transducer<C, D>, d: Transducer<D, E>): Result<A, E>;
export function result<A, B, C, D, E, F>(a: Result<A, B>, b: Transducer<B, C>, c: Transducer<C, D>, d: Transducer<D, E>, f: Transducer<E, F>): Result<A, F>;
export function result<A, B, C, D, E, F, G>(a: Result<A, B>, b: Transducer<B, C>, c: Transducer<C, D>, d: Transducer<D, E>, f: Transducer<E, F>, g: Transducer<F, G>): Result<A, G>;
export function result(source: Result<any, any>, ...transducers: readonly Transducer<any, any>[]): Result<any, any>;
export function result(source: Result<any, any>, ...transducers: readonly Transducer<any, any>[]): Result<any, any> {
    if (source instanceof Failure) return source;
    return new TransducingResult(source, transducers);
}