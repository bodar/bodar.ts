/**
 * @module
 *
 * Assertion functions for testing values against predicates.
 */

import type {Predicate} from "../predicates/Predicate.ts";
import {is} from "../predicates/IsPredicate.ts";
import { toString } from "../functions/toString.ts";

/**
 * Asserts that a value matches a predicate, throwing an error if it doesn't
 *
 * @param actual - The value to test
 * @param predicate - The predicate to test against
 * @throws Error if the predicate returns false
 *
 * @example
 * ```typescript
 * assertThat(5, is(5)); // Passes
 * assertThat(5, is(10)); // Throws Error
 * assertThat([1, 2], equals([1, 2])); // Passes
 * ```
 */
export function assertThat(actual: unknown, predicate: Predicate<any>) {
    if (!predicate(actual)) {
        throw new Error(`assertThat(${toString(actual)}, ${predicate});`);
    }
}

/**
 * Asserts that a value is exactly true
 *
 * @param value - The boolean value to test
 * @throws Error if the value is not true
 *
 * @example
 * ```typescript
 * assertTrue(true); // Passes
 * assertTrue(false); // Throws Error
 * ```
 */
export function assertTrue(value: boolean): asserts value is true {
    assertThat(value, is(true));
}

/**
 * Asserts that a value is exactly false
 *
 * @param value - The boolean value to test
 * @throws Error if the value is not false
 *
 * @example
 * ```typescript
 * assertFalse(false); // Passes
 * assertFalse(true); // Throws Error
 * ```
 */
export function assertFalse(value: boolean): asserts value is false {
    assertThat(value, is(false));
}
