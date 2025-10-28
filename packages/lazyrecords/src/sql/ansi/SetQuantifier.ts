/**
 * @module
 *
 * ANSI SQL set quantifiers (ALL and DISTINCT) for controlling duplicate rows in query results.
 */

import {Text} from "../template/Text.ts";

export class SetQuantifier extends Text {
    static All: SetQuantifier = new SetQuantifier('all');
    static Distinct: SetQuantifier = new SetQuantifier('distinct');

    private constructor(value: string) {
        super(value);
    }
}

export const all = SetQuantifier.All;
export const distinct = SetQuantifier.Distinct;