/**
 * @module
 *
 * A single ANSI common table expression: `name AS (body)`, or `name(col, …) AS (body)`
 * when an explicit column list is supplied. Compose several under a {@link WithClause}.
 */

import {Compound, parens} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import {id} from "../template/Identifier.ts";
import type {Expression} from "../template/Expression.ts";

/** An ANSI common table expression (one entry of a WITH clause). */
export class CommonTableExpression extends Compound {
    static as: Text = text("as");

    constructor(public readonly name: string, public readonly body: Expression, public readonly columns?: readonly string[]) {
        const heading = columns && columns.length
            ? new Compound([id(name), parens(columns.map(id))], text(""))
            : id(name);
        super([heading, CommonTableExpression.as, parens([body])]);
    }
}

/** Creates an ANSI common table expression `name[(cols)] AS (body)`. */
export function cte(name: string, body: Expression, columns?: readonly string[]): CommonTableExpression {
    return new CommonTableExpression(name, body, columns);
}
