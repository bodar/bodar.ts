/**
 * @module
 *
 * Common interface for database records implementations.
 */

import type {Definition, Supported} from "./sql/builder/builders.ts";
import type {Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";
import type {Predicate} from "@bodar/totallylazy/predicates/Predicate.ts";

/**
 * Records interface for type-safe database access.
 * Provides high-level typed operations on table definitions.
 *
 * For low-level SQL execution and transaction control, use Connection directly.
 */
export interface Records {
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
}