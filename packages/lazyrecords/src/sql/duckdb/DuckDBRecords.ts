/**
 * @module
 *
 * DuckDB database records interface using @duckdb/node-api with type-safe query building.
 */

import type {Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";
import {type Definition, toSelect, type Supported} from "../builder/builders.ts";
import {statement} from "../statement/numberedPlaceholder.ts";
import {sql} from "../template/Sql.ts";
import type {Records} from "../Records.ts";
import type {DuckDBResultReader, DuckDBValue} from "@duckdb/node-api";

/**
 * A DuckDB connection interface compatible with @duckdb/node-api.
 * Users can provide any object matching this interface.
 */
export interface DuckDBConnection {
    runAndReadAll(sql: string, params?: DuckDBValue[]): Promise<DuckDBResultReader>;
}

/**
 * Converts array-of-arrays result to array-of-objects using column names.
 */
function toObjects<A>(result: DuckDBResultReader): A[] {
    const columns = result.columnNames();
    return result.getRows().map(row =>
        Object.fromEntries(columns.map((col, i) => [col, row[i]])) as A
    );
}

/**
 * DuckDBRecords provides methods for interacting with a DuckDB database using @duckdb/node-api.
 */
export class DuckDBRecords implements Records {
    /**
     * Creates a new instance of DuckDBRecords.
     *
     * @param connection - The DuckDB connection instance from @duckdb/node-api.
     */
    constructor(private connection: DuckDBConnection) {
    }

    /**
     * Retrieves data from the database based on the provided definition and transducers.
     */
    async get<A>(definition: Definition<A>): Promise<Iterable<A>>;
    async get<A, B>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>): Promise<Iterable<B>>;
    async get<A, B, C>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>): Promise<Iterable<C>>;
    async get<A, B, C, D>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>): Promise<Iterable<D>>;
    async get<A, B, C, D, E>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>): Promise<Iterable<E>>;
    async get<A, B, C, D, E, F>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>, f: Transducer<E, F> & Supported<E>): Promise<Iterable<F>>;
    async get<A>(definition: Definition<A>, ...transducers: readonly Supported<A>[]): Promise<Iterable<A>> {
        const queryOptions = statement(sql(toSelect(definition, ...transducers)));
        const result = await this.connection.runAndReadAll(queryOptions.text, queryOptions.args as DuckDBValue[]);
        return toObjects<A>(result);
    }

    /**
     * Executes a query on the database.
     * Returns results as an async iterable.
     */
    query<A>(definition: Definition<A>): AsyncIterable<A>;
    query<A, B>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>): AsyncIterable<B>;
    query<A, B, C>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>): AsyncIterable<C>;
    query<A, B, C, D>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>): AsyncIterable<D>;
    query<A, B, C, D, E>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>): AsyncIterable<E>;
    query<A, B, C, D, E, F>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>, f: Transducer<E, F> & Supported<E>): AsyncIterable<F>;
    query<A>(definition: Definition<A>, ...transducers: readonly Supported<A>[]): AsyncIterable<A> {
        const self = this;
        const queryOptions = statement(sql(toSelect(definition, ...transducers)));
        return {
            async *[Symbol.asyncIterator]() {
                const result = await self.connection.runAndReadAll(queryOptions.text, queryOptions.args as DuckDBValue[]);
                yield* toObjects<A>(result);
            }
        };
    }
}
