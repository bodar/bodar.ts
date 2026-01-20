import {describe, it, beforeAll, afterAll, expect} from "bun:test";
import {filter} from "@bodar/totallylazy/transducers/FilterTransducer.ts";
import {where} from "@bodar/totallylazy/predicates/WherePredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {definition} from "../../src/sql/builder/builders.ts";
import {keyword} from "../../src/Keyword.ts";
import {select} from "@bodar/totallylazy/functions/Select.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {and} from "@bodar/totallylazy/predicates/AndPredicate.ts";
import {or} from "@bodar/totallylazy/predicates/OrPredicate.ts";
import {between} from "@bodar/totallylazy/predicates/BetweenPredicate.ts";
import {not} from "@bodar/totallylazy/predicates/NotPredicate.ts";
import type {Transaction} from "../../src/Transaction.ts";
import type {Records} from "../../src/Records.ts";
import type {Schema} from "../../src/Schema.ts";

// Shared test data types
export interface Country {
    country_code: string;
    country_name: string;
    population: number;
}

export const countryCode = keyword<Country, 'country_code'>("country_code", String);
export const countryName = keyword<Country, 'country_name'>("country_name", String);
export const population = keyword<Country, 'population'>("population", Number);
export const country = definition<Country>("country", [countryCode, countryName, population]);

// Test data
export const testCountries: Country[] = [
    {country_code: 'GB', country_name: 'United Kingdom', population: 67000000},
    {country_code: 'US', country_name: 'United States', population: 331000000},
    {country_code: 'FR', country_name: 'France', population: 67000000},
    {country_code: 'DE', country_name: 'Germany', population: 83000000},
];

/** Helper to collect async iterable into array */
async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const item of iterable) {
        result.push(item);
    }
    return result;
}

export interface RecordsFactory {
    create(): Promise<{records: Records, schema: Schema, transaction: Transaction}>;
    cleanup?(): Promise<void>;
}

function createContract(describeFn: typeof describe) {
    return (name: string, factory: RecordsFactory) => {
        describeFn(name, () => {
        let records: Records;
        let schema: Schema;
        let transaction: Transaction;

        beforeAll(async () => {
            const result = await factory.create();
            records = result.records;
            schema = result.schema;
            transaction = result.transaction;
            await transaction.begin();
            await schema.define(country);
            await records.add(country, testCountries);
        });

        afterAll(async () => {
            await schema.undefine(country);
            await transaction.commit();
            await factory.cleanup?.();
        });

        describe('get', () => {
            it('returns all records', async () => {
                const rows = await collect(records.get(country));
                expect(rows.length).toBe(4);
            });

            it('filters with where/is', async () => {
                const rows = await collect(records.get(country,
                    filter(where(countryCode, is("GB")))));
                expect(rows.length).toBe(1);
                expect(rows[0].country_code).toBe("GB");
                expect(rows[0].country_name).toBe("United Kingdom");
            });

            it('filters with where/is null', async () => {
                const rows = await collect(records.get(country,
                    filter(where(countryCode, is<string | null>(null)))));
                expect(rows.length).toBe(0);
            });

            it('maps with select', async () => {
                const rows = await collect(records.get(country,
                    filter(where(countryCode, is("GB"))),
                    map(select(countryCode)))) as Pick<Country, 'country_code'>[];
                expect(rows.length).toBe(1);
                expect(rows[0].country_code).toBe("GB");
                expect(rows[0]).not.toHaveProperty('country_name');
            });

            it('filters with and', async () => {
                const rows = await collect(records.get(country,
                    filter(and(
                        where(countryCode, is("GB")),
                        where(countryName, is("United Kingdom"))
                    ))));
                expect(rows.length).toBe(1);
            });

            it('filters with or', async () => {
                const rows = await collect(records.get(country,
                    filter(or(
                        where(countryCode, is("GB")),
                        where(countryCode, is("US"))
                    ))));
                expect(rows.length).toBe(2);
            });

            it('filters with not', async () => {
                const rows = await collect(records.get(country,
                    filter(not(where(countryCode, is("GB"))))));
                expect(rows.length).toBe(3);
                expect(rows.every(r => r.country_code !== "GB")).toBe(true);
            });

            it('filters with between', async () => {
                const rows = await collect(records.get(country,
                    filter(where(population, between(60000000, 70000000)))));
                // GB and FR both have 67 million
                expect(rows.length).toBe(2);
            });
        });

        describe('add', () => {
            it('inserts records and returns count', async () => {
                const newCountries: Country[] = [
                    {country_code: 'JP', country_name: 'Japan', population: 125000000},
                    {country_code: 'AU', country_name: 'Australia', population: 26000000},
                ];
                const count = await records.add(country, newCountries);
                expect(count).toBe(2);

                // Verify the records were inserted
                const rows = await collect(records.get(country, filter(where(countryCode, is("JP")))));
                expect(rows.length).toBe(1);
                expect(rows[0].country_name).toBe("Japan");
            });

            it('returns 0 for empty iterable', async () => {
                const count = await records.add(country, []);
                expect(count).toBe(0);
            });
        });

        describe('remove', () => {
            it('removes records matching predicate', async () => {
                // First verify we have records to remove
                const beforeRows = await collect(records.get(country, filter(where(countryCode, is("AU")))));
                expect(beforeRows.length).toBe(1);

                // Remove Australia (added in previous test)
                const count = await records.remove(country, where(countryCode, is("AU")));
                expect(count).toBe(1);

                // Verify removal
                const afterRows = await collect(records.get(country, filter(where(countryCode, is("AU")))));
                expect(afterRows.length).toBe(0);
            });

            it('removes all records when no predicate', async () => {
                // Get current count
                const beforeRows = await collect(records.get(country));
                expect(beforeRows.length).toBeGreaterThan(0);

                // Remove all
                const count = await records.remove(country);
                expect(count).toBe(beforeRows.length);

                // Verify all removed
                const afterRows = await collect(records.get(country));
                expect(afterRows.length).toBe(0);
            });
        });
        });
    };
}

export const recordsContract = Object.assign(
    createContract(describe),
    {skip: createContract(describe.skip)}
);
