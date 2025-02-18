import type {SQL} from "bun";
import type {Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";
import {type Definition, toSelect, type Supported} from "../builder/builders.ts";
import {statement} from "./statement.ts";
import {sql} from "../template/Sql.ts";

/**
 * PostgresRecords is a class that provides methods for interacting with a PostgreSQL database using Bun's SQL client.
 */
export class PostgresRecords {
    /**
     * Creates a new instance of PostgresRecords.
     * 
     * @param client - The Bun SQL client instance.
     */
    constructor(private client: SQL) {
    }

    /**
     * Retrieves data from the database based on the provided definition and transducers.
     * 
     * @param definition - The definition of the data to retrieve.
     * @param transducers - Optional transducers to apply to the data.
     * @returns A promise that resolves to an iterable of the retrieved data.
     */
    async get<A>(definition: Definition<A>): Promise<Iterable<A>>;
    async get<A, B>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>): Promise<Iterable<A>>;
    async get<A, B, C>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>): Promise<Iterable<A>>;
    async get<A, B, C, D>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>): Promise<Iterable<A>>;
    async get<A, B, C, D, E>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>): Promise<Iterable<A>>;
    async get<A, B, C, D, E, F>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>, f: Transducer<E, F> & Supported<E>): Promise<Iterable<A>>;
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
    query<A, B>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>): AsyncIterable<A>;
    query<A, B, C>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>): AsyncIterable<A>;
    query<A, B, C, D>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>): AsyncIterable<A>;
    query<A, B, C, D, E>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>): AsyncIterable<A>;
    query<A, B, C, D, E, F>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>, f: Transducer<E, F> & Supported<E>): AsyncIterable<A>;
    query<A>(definition: Definition<A>, ...transducers: readonly Supported<A>[]): AsyncIterable<A> {
        const queryOptions = statement(sql(toSelect(definition, ...transducers)));
        return this.client(queryOptions.text, queryOptions.args) as any;
    }
}