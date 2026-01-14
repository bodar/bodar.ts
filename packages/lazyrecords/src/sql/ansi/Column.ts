import {Qualified} from "./Qualified.ts";
import {Aliasable} from "./Aliasable.ts";
import {id, Identifier} from "../template/Identifier.ts";
import {Aliased} from "./Aliased.ts";
import {text, Text} from "../template/Text.ts";

/** Represents a SQL column reference that can be aliased. */
export class Column extends Aliasable {
}

/** Creates a SQL column reference from a name, identifier, or qualified name. */
export function column(name: string | Identifier | Qualified): Column {
    return new Column(typeof name === "string" ? id(name) : name);
}

/** The SQL star (*) selector for selecting all columns. */
export const star: Text = text('*');

/** Union type representing a column, aliased column, or star selector. */
export type ColumnReference = Column | Aliased<Column> | typeof star;
