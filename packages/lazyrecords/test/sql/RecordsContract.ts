import {describe, it, beforeAll, afterAll, expect} from "bun:test";
import type {Records} from "@bodar/lazyrecords/sql/Records.ts";
import {property} from "@bodar/totallylazy/functions/Property.ts";
import {filter} from "@bodar/totallylazy/transducers/FilterTransducer.ts";
import {where} from "@bodar/totallylazy/predicates/WherePredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {definition} from "../../src/sql/builder/builders.ts";
import {select} from "@bodar/totallylazy/functions/Select.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {and} from "@bodar/totallylazy/predicates/AndPredicate.ts";
import {or} from "@bodar/totallylazy/predicates/OrPredicate.ts";
import {between} from "@bodar/totallylazy/predicates/BetweenPredicate.ts";
import {not} from "@bodar/totallylazy/predicates/NotPredicate.ts";

// Shared test data types
export interface Country {
    country_code: string;
    country_name: string;
    population: number;
}

export const country = definition<Country>("country");
export const countryCode = property<Country, 'country_code'>("country_code");
export const countryName = property<Country, 'country_name'>("country_name");
export const population = property<Country, 'population'>("population");

// Test data
export const testCountries: Country[] = [
    {country_code: 'GB', country_name: 'United Kingdom', population: 67000000},
    {country_code: 'US', country_name: 'United States', population: 331000000},
    {country_code: 'FR', country_name: 'France', population: 67000000},
    {country_code: 'DE', country_name: 'Germany', population: 83000000},
];

export interface RecordsFactory {
    create(): Promise<Records>;
    cleanup?(): Promise<void>;
}

function createContract(describeFn: typeof describe) {
    return (name: string, factory: RecordsFactory) => {
        describeFn(name, () => {
        let records: Records;

        beforeAll(async () => {
            records = await factory.create();
        });

        afterAll(async () => {
            await factory.cleanup?.();
        });

        describe('get', () => {
            it('returns all records', async () => {
                const result = await records.get(country);
                const rows = [...result];
                expect(rows.length).toBe(4);
            });

            it('filters with where/is', async () => {
                const result = await records.get(country,
                    filter(where(countryCode, is("GB"))));
                const rows = [...result];
                expect(rows.length).toBe(1);
                expect(rows[0].country_code).toBe("GB");
                expect(rows[0].country_name).toBe("United Kingdom");
            });

            it('filters with where/is null', async () => {
                const result = await records.get(country,
                    filter(where(countryCode, is<string | null>(null))));
                const rows = [...result];
                expect(rows.length).toBe(0);
            });

            it('maps with select', async () => {
                const result = await records.get(country,
                    filter(where(countryCode, is("GB"))),
                    map(select(countryCode)));
                const rows = [...result] as Pick<Country, 'country_code'>[];
                expect(rows.length).toBe(1);
                expect(rows[0].country_code).toBe("GB");
                expect(rows[0]).not.toHaveProperty('country_name');
            });

            it('filters with and', async () => {
                const result = await records.get(country,
                    filter(and(
                        where(countryCode, is("GB")),
                        where(countryName, is("United Kingdom"))
                    )));
                const rows = [...result];
                expect(rows.length).toBe(1);
            });

            it('filters with or', async () => {
                const result = await records.get(country,
                    filter(or(
                        where(countryCode, is("GB")),
                        where(countryCode, is("US"))
                    )));
                const rows = [...result];
                expect(rows.length).toBe(2);
            });

            it('filters with not', async () => {
                const result = await records.get(country,
                    filter(not(where(countryCode, is("GB")))));
                const rows = [...result];
                expect(rows.length).toBe(3);
                expect(rows.every(r => r.country_code !== "GB")).toBe(true);
            });

            it('filters with between', async () => {
                const result = await records.get(country,
                    filter(where(population, between(60000000, 70000000))));
                const rows = [...result];
                // GB and FR both have 67 million
                expect(rows.length).toBe(2);
            });
        });

        describe('query (async iteration)', () => {
            it('returns async iterable', async () => {
                const rows: Country[] = [];
                for await (const row of records.query(country, filter(where(countryCode, is("DE"))))) {
                    rows.push(row);
                }
                expect(rows.length).toBe(1);
                expect(rows[0].country_code).toBe("DE");
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
                const result = await records.get(country, filter(where(countryCode, is("JP"))));
                const rows = [...result];
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
                const beforeResult = await records.get(country, filter(where(countryCode, is("AU"))));
                expect([...beforeResult].length).toBe(1);

                // Remove Australia (added in previous test)
                const count = await records.remove(country, where(countryCode, is("AU")));
                expect(count).toBe(1);

                // Verify removal
                const afterResult = await records.get(country, filter(where(countryCode, is("AU"))));
                expect([...afterResult].length).toBe(0);
            });

            it('removes all records when no predicate', async () => {
                // Get current count
                const beforeResult = await records.get(country);
                const beforeCount = [...beforeResult].length;
                expect(beforeCount).toBeGreaterThan(0);

                // Remove all
                const count = await records.remove(country);
                expect(count).toBe(beforeCount);

                // Verify all removed
                const afterResult = await records.get(country);
                expect([...afterResult].length).toBe(0);
            });
        });
        });
    };
}

export const recordsContract = Object.assign(
    createContract(describe),
    {skip: createContract(describe.skip)}
);
