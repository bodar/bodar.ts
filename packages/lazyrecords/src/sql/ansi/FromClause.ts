import {Compound} from "@bodar/lazyrecords/sql/template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import {type TableReference} from "./Table.ts";

export class FromClause extends Compound {
    static from: Text = text("from");

    constructor(public readonly table: TableReference) {
        super([FromClause.from, table]);
    }
}

export function from(tableReference: TableReference): FromClause {
    return new FromClause(tableReference);
}