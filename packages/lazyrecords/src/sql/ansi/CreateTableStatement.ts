import {text, Text} from "../template/Text.ts";
import {Compound, list} from "../template/Compound.ts";
import {table} from "./Table.ts";
import {id} from "../template/Identifier.ts";
import type {Definition} from "../builder/builders.ts";
import type {Keyword} from "../../Keyword.ts";
import {type ColumnTypeMappings, sqlType} from "../ColumnTypeMappings.ts";

/** Represents a column definition with name and type for CREATE TABLE. */
class ColumnDefinition extends Compound {
    constructor(keyword: Keyword<any, any>, mappings: ColumnTypeMappings) {
        super([id(String(keyword.key)), text(sqlType(keyword.type, mappings))]);
    }
}

/** Represents a complete SQL CREATE TABLE IF NOT EXISTS statement. */
export class CreateTableStatement<A> extends Compound {
    static createTable: Text = text("create table if not exists");

    constructor(
        public readonly definition: Definition<A>,
        public readonly mappings: ColumnTypeMappings
    ) {
        const columnDefs = definition.fields.map(k => new ColumnDefinition(k, mappings));

        super([
            CreateTableStatement.createTable,
            table(definition.name),
            text("("),
            list(columnDefs),
            text(")")
        ]);
    }
}

/** Creates a SQL CREATE TABLE IF NOT EXISTS statement from a definition and type mappings. */
export function createTableStatement<A>(definition: Definition<A>, mappings: ColumnTypeMappings): CreateTableStatement<A> {
    return new CreateTableStatement(definition, mappings);
}
