/** @module Find first element matching a predicate */

import type {Predicate} from "../predicates/Predicate.ts";
import {Transducer, transducer} from "./Transducer.ts";

export interface FindTransducer<A> extends Transducer<A, A> {
    readonly predicate: Predicate<A>;
    readonly [Transducer.type]: 'find';
}

/**
 * Returns first element matching the predicate
 */
export function find<A>(predicate: Predicate<A>): FindTransducer<A> {
    return transducer('find', function* (iterable: Iterable<A>) {
        for (const a of iterable) {
            if (predicate(a)) {
                yield a;
                return;
            }
        }
    }, {predicate});
}

export function isFindTransducer(value: any): value is FindTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'find' && Object.hasOwn(value, 'predicate');
}
