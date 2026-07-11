/**
 * @module
 *
 * SQL comparison predicate (`> ?`, `>= ?`, `< ?`, `<= ?`, `!= ?`, `= ?`) over a bound
 * value. The predicand appears at the call site; this node is the predicate tail,
 * mirroring {@link IsExpression}. Combine with a predicand in a space-separated
 * compound, e.g. `expression(column, comparison('>=', 42))`.
 */

import {text} from "../template/Text.ts";
import {value} from "../template/Value.ts";
import {PredicateExpression} from "./PredicateExpression.ts";

/** The SQL binary comparison operators. */
export type ComparisonOperator = '=' | '!=' | '<' | '<=' | '>' | '>=';

/** A SQL comparison predicate against a bound value. */
export class ComparisonExpression extends PredicateExpression {
    constructor(public readonly operator: ComparisonOperator, public readonly operand: unknown) {
        super([text(operator), value(operand)]);
    }
}

/** Creates a SQL comparison predicate (`operator operand`). */
export function comparison(operator: ComparisonOperator, operand: unknown): ComparisonExpression {
    return new ComparisonExpression(operator, operand);
}
