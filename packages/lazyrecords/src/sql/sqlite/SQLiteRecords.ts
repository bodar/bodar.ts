/**
 * @module
 *
 * SQLite database records interface using Bun's SQLite with type-safe query building.
 */

import type {Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";
import type {Predicate} from "@bodar/totallylazy/predicates/Predicate.ts";
import {type Definition, toSelect, type Supported} from "../builder/builders.ts";
import {statement} from "../statement/ordinalPlaceholder.ts";
import {sql} from "../template/Sql.ts";
import type {Records} from "../Records.ts";
import {InsertStatement} from "../ansi/InsertStatement.ts";
import {DeleteStatement} from "../ansi/DeleteStatement.ts";

/**
 * A minimal SQLite database interface compatible with Bun's SQLite Database.
 */
export interface SQLiteDatabase {
    query(sql: string): {
        all(...params: unknown[]): unknown[];
        run(...params: unknown[]): { changes: number };
    };
}

/**
 * SQLiteRecords provides async methods for interacting with a SQLite database using Bun's SQLite.
 */
export class SQLiteRecords implements Records {
    /**
     * Creates a new instance of SQLiteRecords.
     *
     * @param db - The SQLite database instance (e.g., Bun's Database from bun:sqlite).
     */
    constructor(private db: SQLiteDatabase) {
    }

    /**
     * Retrieves data from the database based on the provided definition and transducers.
     *
     * @param definition - The definition of the data to retrieve.
     * @param transducers - Optional transducers to apply to the data.
     * @returns A promise that resolves to an iterable of the retrieved data.
     */
    async get<A>(definition: Definition<A>): Promise<Iterable<A>>;
    async get<A, B>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>): Promise<Iterable<B>>;
    async get<A, B, C>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>): Promise<Iterable<C>>;
    async get<A, B, C, D>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>): Promise<Iterable<D>>;
    async get<A, B, C, D, E>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>): Promise<Iterable<E>>;
    async get<A, B, C, D, E, F>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>, f: Transducer<E, F> & Supported<E>): Promise<Iterable<F>>;
    async get<A>(definition: Definition<A>, ...transducers: readonly Supported<A>[]): Promise<Iterable<A>> {
        const queryOptions = statement(sql(toSelect(definition, ...transducers)));
        const result = this.db.query(queryOptions.text).all(...queryOptions.args);
        return result as A[];
    }

    /**
     * Executes a query on the database.
     *
     * @param definition - The definition of the query to execute.
     * @param transducers - Optional transducers to apply to the query results.
     * @returns An async iterable of the query results.
     */
    query<A>(definition: Definition<A>): AsyncIterable<A>;
    query<A, B>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>): AsyncIterable<B>;
    query<A, B, C>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>): AsyncIterable<C>;
    query<A, B, C, D>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>): AsyncIterable<D>;
    query<A, B, C, D, E>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>): AsyncIterable<E>;
    query<A, B, C, D, E, F>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>, f: Transducer<E, F> & Supported<E>): AsyncIterable<F>;
    async *query<A>(definition: Definition<A>, ...transducers: readonly Supported<A>[]): AsyncIterable<A> {
        const queryOptions = statement(sql(toSelect(definition, ...transducers)));
        const results = this.db.query(queryOptions.text).all(...queryOptions.args) as A[];
        for (const row of results) {
            yield row;
        }
    }

    async add<A>(definition: Definition<A>, records: Iterable<A>): Promise<number> {
        let count = 0;
        for (const record of records) {
            const stmt = statement(sql(new InsertStatement(definition, record)));
            const result = this.db.query(stmt.text).run(...stmt.args);
            count += result.changes;
        }
        return count;
    }

    async remove<A>(definition: Definition<A>, predicate?: Predicate<A>): Promise<number> {
        const stmt = statement(sql(new DeleteStatement(definition, predicate)));
        const result = this.db.query(stmt.text).run(...stmt.args);
        return result.changes;
    }

    async execute(expression: Compound): Promise<void> {
        const stmt = statement(sql(expression));
        this.db.query(stmt.text).run(...stmt.args);
    }
}

import type {Compound} from "../template/Compound.ts";
