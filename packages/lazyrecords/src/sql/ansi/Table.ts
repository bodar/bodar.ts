/**
 * @module
 *
 * ANSI SQL table references for use in FROM clauses.
 */

import {Qualified} from "./Qualified.ts";
import {Aliasable} from "./Aliasable.ts";
import {id, Identifier} from "../template/Identifier.ts";
import {Aliased} from "./Aliased.ts";

/** Represents a SQL table reference that can be aliased. */
export class Table extends Aliasable {
}

/** Creates a SQL table reference from a name, identifier, or qualified name. */
export function table(name: string | Identifier | Qualified): Table {
    return new Table(typeof name === "string" ? id(name) : name);
}

/** Union type representing either a table or an aliased table reference. */
export type TableReference = Table | Aliased<Table>;
