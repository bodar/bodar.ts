import {Qualified} from "./Qualified.ts";
import {Aliasable} from "./Aliasable.ts";
import {type SQL} from "@bodar/lazyrecords/sql/template/Sql.ts";
import {id} from "@bodar/lazyrecords/sql/template/Identifier.ts";
import {Aliased} from "./Aliased.ts";
import {text} from "../template/Text.ts";

export class Column extends Aliasable {
}

export function column(name: string | Identifier | Qualified): Column {
    return new Column(typeof name === "string" ? id(name) : name);
}

export const star = text('*');

export type ColumnReference = Column | Aliased<Column> | typeof star;
