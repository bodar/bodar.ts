/** @module Get first element from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface FirstTransducer<A> extends Transducer<A, A> {
    readonly [Transducer.type]: 'first';
}

/**
 * Returns first element
 */
export function first<A>(): FirstTransducer<A> {
    return transducer('first', function* (iterable: Iterable<A>) {
        for (const a of iterable) {
            yield a;
            return;
        }
    }, {});
}

export function isFirstTransducer(value: any): value is FirstTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'first';
}
