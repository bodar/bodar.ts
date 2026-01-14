import {text, Text} from "../template/Text.ts";
import {Compound} from "../template/Compound.ts";
import {Expression} from "../template/Expression.ts";
import {table} from "./Table.ts";
import {WhereClause} from "./WhereClause.ts";
import {toCompound} from "../builder/builders.ts";
import type {Definition} from "../builder/builders.ts";
import type {Predicate} from "@bodar/totallylazy/predicates/Predicate.ts";

/** Represents a complete SQL DELETE statement built from a definition and optional predicate. */
export class DeleteStatement<A> extends Compound {
    static delete: Text = text("delete");
    static from: Text = text("from");

    constructor(
        public readonly definition: Definition<A>,
        public readonly predicate?: Predicate<A>
    ) {
        const whereClause = predicate ? new WhereClause(toCompound(predicate)) : undefined;

        super([
            DeleteStatement.delete,
            DeleteStatement.from,
            table(definition.name),
            whereClause
        ].filter(Boolean) as Expression[]);
    }
}

/** Creates a SQL DELETE statement from a definition and optional predicate. */
export function deleteStatement<A>(definition: Definition<A>, predicate?: Predicate<A>): DeleteStatement<A> {
    return new DeleteStatement(definition, predicate);
}
