/** @module Take first N elements from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface TakeTransducer<A> extends Transducer<A, A> {
    readonly count: number;
    readonly [Transducer.type]: 'take';
}

/**
 * Returns first count elements
 */
export function take<A>(count: number): TakeTransducer<A> {
    return transducer('take', function* (iterable: Iterable<A>) {
        if (count < 1) return;
        let taken = 0;
        for (const a of iterable) {
            yield a;
            if (++taken >= count) return;
        }
    }, {count});
}

export function isTakeTransducer(value: any): value is TakeTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'take' && Object.hasOwn(value, 'count');
}
