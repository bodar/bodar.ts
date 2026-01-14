import {text, Text} from "../template/Text.ts";
import {Compound, ids, values} from "../template/Compound.ts";
import {table} from "./Table.ts";
import type {Definition} from "../builder/builders.ts";

/** Represents a complete SQL INSERT statement built from a definition and a single record. */
export class InsertStatement<A> extends Compound {
    static insert: Text = text("insert");
    static into: Text = text("into");
    static values: Text = text("values");

    constructor(
        public readonly definition: Definition<A>,
        public readonly record: A
    ) {
        const obj = record as Record<string, unknown>;
        const columns = Object.keys(obj);

        super([
            InsertStatement.insert,
            InsertStatement.into,
            table(definition.name),
            text("("), ids(columns), text(")"),
            InsertStatement.values,
            text("("), values(columns.map(c => obj[c])), text(")")
        ]);
    }
}

/** Creates a SQL INSERT statement from a definition and record. */
export function insertStatement<A>(definition: Definition<A>, record: A): InsertStatement<A> {
    return new InsertStatement(definition, record);
}
