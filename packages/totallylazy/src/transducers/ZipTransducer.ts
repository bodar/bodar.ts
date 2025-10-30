/** @module Combine two iterables into tuples */

import {Transducer, transducer} from "./Transducer.ts";

export interface ZipTransducer<A, B> extends Transducer<A, [A, B]> {
    readonly other: Iterable<B>;
    readonly [Transducer.type]: 'zip';
}

/**
 * Combines elements from two iterables into tuples, stops when either ends
 */
export function zip<A, B>(other: Iterable<B>): ZipTransducer<A, B> {
    return transducer('zip', function* (iterable: Iterable<A>): Iterable<[A, B]> {
        const iteratorA = iterable[Symbol.iterator]();
        const iteratorB = other[Symbol.iterator]();
        while (true) {
            const resultA = iteratorA.next();
            const resultB = iteratorB.next();
            if (resultA.done || resultB.done) return;
            yield [resultA.value, resultB.value] as [A, B];
        }
    }, {other});
}

export function isZipTransducer(value: any): value is ZipTransducer<any, any> {
    return value instanceof Transducer && value[Transducer.type] === 'zip' && Object.hasOwn(value, 'other');
}
