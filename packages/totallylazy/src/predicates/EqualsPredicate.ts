import type {Predicate} from "./Predicate.ts";
import {toString} from "../functions/toString.ts";
import {equal} from "../functions/equal.ts";

/**
 * A predicate that checks if the value is deeply equal by value to the given value
 *
 * Implements Same Value Zero Equality (https://tc39.es/ecma262/#sec-samevaluezero)
 */
export interface EqualsPredicate<A> extends Predicate<A> {
    /**
     * The value to check against
     */
    readonly value: A;
}

/**
 * Creates a predicate that checks if the value is deeply equal by value to the given value
 */
export function equals<A>(value: A): EqualsPredicate<A> {
    return Object.assign((a: A) => equal(a, value), {
        value: value,
        toString: () => `equals(${toString(value)})`
    });
}
