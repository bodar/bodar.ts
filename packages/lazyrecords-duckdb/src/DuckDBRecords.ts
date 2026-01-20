/**
 * @module
 *
 * DuckDB database records interface using Connection with type-safe query building.
 */

import type {Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";
import type {Predicate} from "@bodar/totallylazy/predicates/Predicate.ts";
import {type Definition, toSelect, type Supported} from "@bodar/lazyrecords/sql/builder/builders.ts";
import type {Connection} from "@bodar/lazyrecords/sql/Connection.ts";
import {InsertStatement} from "@bodar/lazyrecords/sql/ansi/InsertStatement.ts";
import {DeleteStatement} from "@bodar/lazyrecords/sql/ansi/DeleteStatement.ts";
import type {Records} from "@bodar/lazyrecords/Records.ts";

/**
 * DuckDBRecords provides type-safe database operations for DuckDB.
 * Uses Connection for query execution and transaction control.
 */
export class DuckDBRecords implements Records {
    /**
     * Creates a new instance of DuckDBRecords.
     *
     * @param connection - The Connection instance for database operations.
     */
    constructor(private readonly connection: Connection) {}

    /**
     * Retrieves data from the database based on the provided definition and transducers.
     *
     * @param definition - The definition of the data to retrieve.
     * @param transducers - Optional transducers to apply to the data.
     * @returns An async iterable of the retrieved data.
     */
    get<A>(definition: Definition<A>): AsyncIterable<A>;
    get<A, B>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>): AsyncIterable<B>;
    get<A, B, C>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>): AsyncIterable<C>;
    get<A, B, C, D>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>): AsyncIterable<D>;
    get<A, B, C, D, E>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>): AsyncIterable<E>;
    get<A, B, C, D, E, F>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>, f: Transducer<E, F> & Supported<E>): AsyncIterable<F>;
    get<A>(definition: Definition<A>, ...transducers: readonly Supported<A>[]): AsyncIterable<A> {
        return this.connection.query(toSelect(definition, ...transducers)) as AsyncIterable<A>;
    }

    async add<A>(definition: Definition<A>, records: Iterable<A>): Promise<number> {
        let count = 0;
        for (const record of records) {
            const result = await this.connection.execute(new InsertStatement(definition, record));
            count += result.rowsChanged;
        }
        return count;
    }

    async remove<A>(definition: Definition<A>, predicate?: Predicate<A>): Promise<number> {
        const result = await this.connection.execute(new DeleteStatement(definition, predicate));
        return result.rowsChanged;
    }
}
