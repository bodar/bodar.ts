/**
 * @module
 *
 * An ANSI inner `JOIN table ON condition` clause. The table and condition are supplied
 * as expressions (e.g. an aliased {@link Table} and a boolean compound).
 */

import {Compound} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import type {Expression} from "../template/Expression.ts";

/** An ANSI inner `JOIN … ON …` clause. */
export class JoinClause extends Compound {
    static join: Text = text("join");
    static on: Text = text("on");

    constructor(public readonly table: Expression, public readonly condition: Expression) {
        super([JoinClause.join, table, JoinClause.on, condition]);
    }
}

/** Creates an ANSI inner `JOIN table ON condition` clause. */
export function join(table: Expression, condition: Expression): JoinClause {
    return new JoinClause(table, condition);
}
