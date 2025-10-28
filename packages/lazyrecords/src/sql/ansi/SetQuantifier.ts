/**
 * @module
 *
 * ANSI SQL set quantifiers (ALL and DISTINCT) for controlling duplicate rows in query results.
 */

import {Text} from "../template/Text.ts";

/** SQL set quantifier for controlling duplicate rows (ALL or DISTINCT). */
export class SetQuantifier extends Text {
    static All: SetQuantifier = new SetQuantifier('all');
    static Distinct: SetQuantifier = new SetQuantifier('distinct');

    private constructor(value: string) {
        super(value);
    }
}

/** The ALL set quantifier (returns all rows including duplicates). */
export const all = SetQuantifier.All;

/** The DISTINCT set quantifier (returns only unique rows). */
export const distinct = SetQuantifier.Distinct;