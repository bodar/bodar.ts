/** @module Skip elements while predicate is true */

import type {Predicate} from "../predicates/Predicate.ts";
import {Transducer, transducer} from "./Transducer.ts";

export interface DropWhileTransducer<A> extends Transducer<A, A> {
    readonly predicate: Predicate<A>;
    readonly [Transducer.type]: 'dropWhile';
}

/**
 * Skips elements while predicate is true, yields all after first false
 */
export function dropWhile<A>(predicate: Predicate<A>): DropWhileTransducer<A> {
    return transducer('dropWhile', function* (iterable: Iterable<A>) {
        let dropping = true;
        for (const a of iterable) {
            if (dropping && predicate(a)) continue;
            dropping = false;
            yield a;
        }
    }, {predicate});
}

export function isDropWhileTransducer(value: any): value is DropWhileTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'dropWhile' && Object.hasOwn(value, 'predicate');
}
