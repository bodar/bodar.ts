import {text, Text} from "@bodar/lazyrecords/sql/template/Text.ts";
import {SetQuantifier} from "./SetQuantifier.ts";
import {Compound, list} from "@bodar/lazyrecords/sql/template/Compound.ts";
import {FromClause} from "./FromClause.ts";
import {WhereClause} from "./WhereClause.ts";
import {Expression} from "@bodar/lazyrecords/sql/template/Expression.ts";
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

export type SelectList = (ColumnReference)[] | (ColumnReference);

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

export function select(setQuantifier: SetQuantifier,
                       selectList: SelectList,
                       fromClause: FromClause,
                       whereClause?: WhereClause): SelectExpression {
    return new SelectExpression(setQuantifier, selectList, fromClause, whereClause);
}
