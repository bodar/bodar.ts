/**
 * @module
 *
 * PostgreSQL database records interface using Bun's SQL client with type-safe query building.
 */

import type {Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";
import type {Predicate} from "@bodar/totallylazy/predicates/Predicate.ts";
import {type Definition, toSelect, type Supported} from "../builder/builders.ts";
import {statement} from "../statement/numberedPlaceholder.ts";
import {sql} from "../template/Sql.ts";
import type {Records} from "../Records.ts";
import {InsertStatement} from "../ansi/InsertStatement.ts";
import {DeleteStatement} from "../ansi/DeleteStatement.ts";

/**
 * A SQL client interface that can execute queries with parameters.
 * Compatible with Bun's SQL client.
 */
export interface SQLClient {
    (query: string, params: unknown[]): Promise<any> | AsyncIterable<any>;
}

/**
 * PostgresRecords is a class that provides methods for interacting with a PostgreSQL database using Bun's SQL client.
 */
export class PostgresRecords implements Records {
    /**
     * Creates a new instance of PostgresRecords.
     *
     * @param client - The SQL client instance (e.g., Bun's SQL client).
     */
    constructor(private client: SQLClient) {
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
        const result = await this.client(queryOptions.text, queryOptions.args);
        return result;
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
    query<A>(definition: Definition<A>, ...transducers: readonly Supported<A>[]): AsyncIterable<A> {
        const queryOptions = statement(sql(toSelect(definition, ...transducers)));
        return this.client(queryOptions.text, queryOptions.args) as any;
    }

    async add<A>(definition: Definition<A>, records: Iterable<A>): Promise<number> {
        let count = 0;
        for (const record of records) {
            const stmt = statement(sql(new InsertStatement(definition, record)));
            const result = await this.client(stmt.text, stmt.args) as { count: number };
            count += result.count ?? 1;
        }
        return count;
    }

    async remove<A>(definition: Definition<A>, predicate?: Predicate<A>): Promise<number> {
        const stmt = statement(sql(new DeleteStatement(definition, predicate)));
        const result = await this.client(stmt.text, stmt.args) as { count: number };
        return result.count ?? 0;
    }
}