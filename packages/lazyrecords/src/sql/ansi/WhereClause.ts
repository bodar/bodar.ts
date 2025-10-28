/**
 * @module
 *
 * ANSI SQL WHERE clause for filtering query results based on conditions.
 */

import {and, Compound, or} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import {Column} from "./Column.ts";

import {PredicateExpression} from "./PredicateExpression.ts";

/** Type alias for SQL predicands used in WHERE conditions. */
export type Predicand = Column;

/** Represents a SQL WHERE clause for filtering query results. */
export class WhereClause extends Compound {
    static where: Text = text("where");

    constructor(public readonly expression: Compound) {
        super([WhereClause.where, expression]);
    }

    and(predicand: Predicand, predicate: PredicateExpression): WhereClause {
        return new WhereClause(and(this.expression, new PredicatePair(predicand, predicate)));
    }

    or(predicand: Predicand, predicate: PredicateExpression): WhereClause {
        return new WhereClause(or(this.expression, new PredicatePair(predicand, predicate)));
    }
}

/** Creates a WHERE clause from a predicand and predicate expression. */
export function where(predicand: Predicand, predicate: PredicateExpression): WhereClause {
    return new WhereClause(new PredicatePair(predicand, predicate));
}

/** Represents a pair of predicand and predicate for WHERE conditions. */
export class PredicatePair extends Compound {
    constructor(public readonly predicand: Predicand, public readonly predicate: PredicateExpression) {
        super([predicand, predicate]);
    }
}
