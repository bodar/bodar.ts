/**
 * @module
 *
 * An ANSI `JOIN table ON condition` clause — inner by default, or `LEFT JOIN`. The table
 * and condition are supplied as expressions (e.g. an aliased {@link Table} and a boolean
 * compound).
 */

import {Compound} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import type {Expression} from "../template/Expression.ts";

/** An ANSI `JOIN … ON …` clause (inner or left). */
export class JoinClause extends Compound {
    static join: Text = text("join");
    static leftJoin: Text = text("left join");
    static on: Text = text("on");

    constructor(public readonly table: Expression, public readonly condition: Expression, public readonly left: boolean = false) {
        super([left ? JoinClause.leftJoin : JoinClause.join, table, JoinClause.on, condition]);
    }
}

/** Creates an ANSI inner `JOIN table ON condition` clause. */
export function join(table: Expression, condition: Expression): JoinClause {
    return new JoinClause(table, condition);
}

/** Creates an ANSI `LEFT JOIN table ON condition` clause. */
export function leftJoin(table: Expression, condition: Expression): JoinClause {
    return new JoinClause(table, condition, true);
}
