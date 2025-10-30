/** @module Pass-through transducer */

import {Transducer, transducer} from "./Transducer.ts";

export interface IdentityTransducer<A> extends Transducer<A, A> {
    readonly [Transducer.type]: 'identity';
}

/**
 * Returns elements unchanged (pass-through)
 */
export function identity<A>(): IdentityTransducer<A> {
    return transducer('identity', function* (iterable: Iterable<A>) {
        yield* iterable;
    }, {});
}

export function isIdentityTransducer(value: any): value is IdentityTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'identity';
}
