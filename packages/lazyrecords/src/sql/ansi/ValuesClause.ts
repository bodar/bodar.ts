/**
 * @module
 *
 * An ANSI `VALUES (…), (…)` row constructor. Each row's cells are bound values, so an
 * inline set of literals renders as `values (?), (?)` with the values in the bind
 * array. Useful as an inline table (e.g. a CTE body of injected ids).
 */

import {Compound, list, parens} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import {value} from "../template/Value.ts";
import type {Expression} from "../template/Expression.ts";

/** An ANSI `VALUES` row constructor over one or more rows of bound values. */
export class ValuesClause extends Compound {
    static values: Text = text("values");

    constructor(public readonly rows: readonly (readonly unknown[])[]) {
        super([ValuesClause.values, list(rows.map(row => parens(row.map(value) as Expression[])))]);
    }
}

/** Creates an ANSI `VALUES (…), (…)` row constructor. */
export function valuesClause(rows: readonly (readonly unknown[])[]): ValuesClause {
    return new ValuesClause(rows);
}
