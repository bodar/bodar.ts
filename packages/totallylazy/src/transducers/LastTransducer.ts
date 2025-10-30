/** @module Get last element from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface LastTransducer<A> extends Transducer<A, A> {
    readonly [Transducer.type]: 'last';
}

/**
 * Returns last element
 */
export function last<A>(): LastTransducer<A> {
    return transducer('last', function* (iterable: Iterable<A>) {
        let lastValue: A | undefined;
        let hasValue = false;
        for (const a of iterable) {
            lastValue = a;
            hasValue = true;
        }
        if (hasValue) yield lastValue!;
    }, {});
}

export function isLastTransducer(value: any): value is LastTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'last';
}
