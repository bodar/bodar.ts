/** @module Core transducer type and utilities */
import {isCurried} from "../functions/curry.ts";

/** A transducer that can be applied synchronously */
export interface Transducer<A, B> {
    (iterable: Iterable<A>): Iterable<B>;

    toString(): string;

    readonly [Transducer.type]: string;
}

export class Transducer<A, B> {
    static readonly type = Symbol('Transducer.type');

    static [Symbol.hasInstance](value: any): boolean {
        return typeof value === 'function' && value.length === 1 && (Object.hasOwn(value, Transducer.type) || isCurried(value));
    }
}

/** Creates a custom transducer with the given name, implementation, and properties */
export function transducer<N extends string, T extends (iterable: Iterable<any>) => Iterable<any>, U extends object>(name: N, target: T, source: U): {[Transducer.type]: N} & T & U {
    return Object.assign(target, {
        [Transducer.type]: name,
        toString: () => `${name}(${(Object.values(source).join(', '))})`
    }, source);
}
