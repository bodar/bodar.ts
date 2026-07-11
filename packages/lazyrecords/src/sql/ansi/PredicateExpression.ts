/**
 * @module
 *
 * Base class for SQL predicate tails (the operator+operand half of a
 * comparison) used in `WHERE` clauses.
 */
import {Compound} from "../template/Compound.ts";

/** Base class for SQL predicate expressions used in WHERE clauses. */
export class PredicateExpression extends Compound {
}