/** @module Take elements while predicate is true */

import type {Predicate} from "../predicates/Predicate.ts";
import {Transducer, transducer} from "./Transducer.ts";

export interface TakeWhileTransducer<A> extends Transducer<A, A> {
    readonly predicate: Predicate<A>;
    readonly [Transducer.type]: 'takeWhile';
}

/**
 * Returns elements while predicate is true, stops at first false
 */
export function takeWhile<A>(predicate: Predicate<A>): TakeWhileTransducer<A> {
    return transducer('takeWhile', function* (iterable: Iterable<A>) {
        for (const a of iterable) {
            if (!predicate(a)) return;
            yield a;
        }
    }, {predicate});
}

export function isTakeWhileTransducer(value: any): value is TakeWhileTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'takeWhile' && Object.hasOwn(value, 'predicate');
}
