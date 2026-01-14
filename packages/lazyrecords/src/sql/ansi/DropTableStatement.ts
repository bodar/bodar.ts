import {text, Text} from "../template/Text.ts";
import {Compound} from "../template/Compound.ts";
import {table} from "./Table.ts";
import type {Definition} from "../builder/builders.ts";

/** Represents a complete SQL DROP TABLE IF EXISTS statement. */
export class DropTableStatement<A> extends Compound {
    static dropTable: Text = text("drop table if exists");

    constructor(public readonly definition: Definition<A>) {
        super([
            DropTableStatement.dropTable,
            table(definition.name)
        ]);
    }
}

/** Creates a SQL DROP TABLE IF EXISTS statement from a definition. */
export function dropTableStatement<A>(definition: Definition<A>): DropTableStatement<A> {
    return new DropTableStatement(definition);
}
