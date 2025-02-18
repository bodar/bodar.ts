import {and, Compound, or} from "../template/Compound.ts";
import {text} from "../template/Text.ts";
import {Column} from "./Column.ts";

import {PredicateExpression} from "./PredicateExpression.ts";

export type Predicand = Column;

export class WhereClause extends Compound {
    static where = text("where");

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

export function where(predicand: Predicand, predicate: PredicateExpression): WhereClause {
    return new WhereClause(new PredicatePair(predicand, predicate));
}

export class PredicatePair extends Compound {
    constructor(public readonly predicand: Predicand, public readonly predicate: PredicateExpression) {
        super([predicand, predicate]);
    }
}
