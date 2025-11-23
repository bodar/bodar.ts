/** @module
 * Assertion functions for testing values against predicates.
 */

import type {Predicate} from "../predicates/Predicate.ts";
import {is} from "../predicates/IsPredicate.ts";
import { toString } from "../functions/toString.ts";

/** Asserts that a value matches a predicate, throwing an error if it doesn't */
export function assertThat(actual: unknown, predicate: Predicate<any>) {
    if (!predicate(actual)) {
        throw new Error(`assertThat(${toString(actual)}, ${predicate});`);
    }
}

/** Asserts that a value is exactly true */
export function assertTrue(value: boolean): asserts value is true {
    assertThat(value, is(true));
}

/** Asserts that a value is exactly false */
export function assertFalse(value: boolean): asserts value is false {
    assertThat(value, is(false));
}
