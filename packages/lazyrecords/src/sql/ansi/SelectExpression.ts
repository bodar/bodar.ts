/**
 * @module
 *
 * ANSI SQL SELECT statement builder combining set quantifiers, columns, tables, and filters.
 */

import {text, Text} from "../template/Text.ts";
import {SetQuantifier} from "./SetQuantifier.ts";
import {Compound, list} from "../template/Compound.ts";
import {FromClause} from "./FromClause.ts";
import {WhereClause} from "./WhereClause.ts";
import {Expression} from "../template/Expression.ts";
import type {ColumnReference} from "./Column.ts";


/*
    TextOnlyExpression select = textOnly("select");
    Option<SetQuantifier> setQuantifier();
    SelectList selectList();
    FromClause fromClause();
    Option<WhereClause> whereClause();
    Option<OrderByClause> orderByClause();
    Option<GroupByClause> groupByClause();
    Option<OffsetClause> offsetClause();
    Option<FetchClause> fetchClause();
 */

/** Union type representing one or more column references in a SELECT list. */
export type SelectList = (ColumnReference)[] | (ColumnReference);

/** Represents a complete SQL SELECT statement with quantifier, columns, FROM, and optional WHERE. */
export class SelectExpression extends Compound {
    static select: Text = text("select");

    constructor(public readonly setQuantifier: SetQuantifier,
                public readonly selectList: SelectList,
                public readonly fromClause: FromClause,
                public readonly whereClause?: WhereClause) {
        super([SelectExpression.select,
            setQuantifier,
            Array.isArray(selectList) ? list(selectList) : selectList,
            fromClause,
            whereClause]
            .filter(Boolean) as Expression[]);
    }
}

/** Creates a SQL SELECT expression from quantifier, columns, table, and optional WHERE clause. */
export function select(setQuantifier: SetQuantifier,
                       selectList: SelectList,
                       fromClause: FromClause,
                       whereClause?: WhereClause): SelectExpression {
    return new SelectExpression(setQuantifier, selectList, fromClause, whereClause);
}
