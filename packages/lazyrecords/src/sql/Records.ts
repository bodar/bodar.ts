/**
 * @module
 *
 * Common interface for database records implementations.
 */

import type {Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";
import type {Predicate} from "@bodar/totallylazy/predicates/Predicate.ts";
import {type Definition, type Supported} from "./builder/builders.ts";

/**
 * Records interface for type-safe database access.
 * Implementations include PostgresRecords and SQLiteRecords.
 */
export interface Records {
    /**
     * Retrieves data from the database based on the provided definition and transducers.
     *
     * @param definition - The definition of the data to retrieve.
     * @param transducers - Optional transducers to apply to the data.
     * @returns A promise that resolves to an iterable of the retrieved data.
     */
    get<A>(definition: Definition<A>): Promise<Iterable<A>>;
    get<A, B>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>): Promise<Iterable<B>>;
    get<A, B, C>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>): Promise<Iterable<C>>;
    get<A, B, C, D>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>): Promise<Iterable<D>>;
    get<A, B, C, D, E>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>): Promise<Iterable<E>>;
    get<A, B, C, D, E, F>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>, f: Transducer<E, F> & Supported<E>): Promise<Iterable<F>>;

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

    /**
     * Inserts records into the database.
     *
     * @param definition - The table definition.
     * @param records - The records to insert.
     * @returns A promise resolving to the number of rows inserted.
     */
    add<A>(definition: Definition<A>, records: Iterable<A>): Promise<number>;

    /**
     * Removes records from the database.
     *
     * @param definition - The table definition.
     * @param predicate - Optional predicate to filter which records to delete. If omitted, deletes all records.
     * @returns A promise resolving to the number of rows deleted.
     */
    remove<A>(definition: Definition<A>, predicate?: Predicate<A>): Promise<number>;

    /**
     * Executes a raw SQL expression (used for DDL operations like CREATE TABLE).
     *
     * @param expression - The SQL expression to execute.
     */
    execute(expression: Compound): Promise<void>;
}

import type {Compound} from "./template/Compound.ts";
