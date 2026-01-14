import {Compound} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import {type TableReference} from "./Table.ts";

/** Represents a SQL FROM clause specifying the table to query. */
export class FromClause extends Compound {
    static from: Text = text("from");

    constructor(public readonly table: TableReference) {
        super([FromClause.from, table]);
    }
}

/** Creates a FROM clause from a table reference. */
export function from(tableReference: TableReference): FromClause {
    return new FromClause(tableReference);
}