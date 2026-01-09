import {describe, it, beforeAll, afterAll} from "bun:test";
import {DuckDBInstance} from "@duckdb/node-api";
import {DuckDBRecords} from "@bodar/lazyrecords/sql/duckdb/DuckDBRecords.ts";
import {property} from "@bodar/totallylazy/functions/Property.ts";
import {filter} from "@bodar/totallylazy/transducers/FilterTransducer.ts";
import {where} from "@bodar/totallylazy/predicates/WherePredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {definition} from "@bodar/lazyrecords/sql/builder/builders.ts";
import {select} from "@bodar/totallylazy/functions/Select.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {and} from "@bodar/totallylazy/predicates/AndPredicate.ts";
import {or} from "@bodar/totallylazy/predicates/OrPredicate.ts";
import {between} from "@bodar/totallylazy/predicates/BetweenPredicate.ts";

interface Country {
    country_code: string;
    country_name: string;
    population: number;
}

const country = definition<Country>("country");
const countryCode = property<Country, 'country_code'>("country_code");
const countryName = property<Country, 'country_name'>("country_name");
const population = property<Country, 'population'>("population");

describe("DuckDBRecords", () => {
    let instance: DuckDBInstance;
    let connection: Awaited<ReturnType<DuckDBInstance['connect']>>;
    let records: DuckDBRecords;

    beforeAll(async () => {
        instance = await DuckDBInstance.create(':memory:');
        connection = await instance.connect();

        // Create test table and insert data
        await connection.run(`
            CREATE TABLE country (
                country_code VARCHAR,
                country_name VARCHAR,
                population INTEGER
            )
        `);
        await connection.run(`
            INSERT INTO country VALUES
                ('GB', 'United Kingdom', 67000000),
                ('US', 'United States', 331000000),
                ('FR', 'France', 67000000),
                ('DE', 'Germany', 83000000)
        `);

        records = new DuckDBRecords(connection);
    });

    afterAll(async () => {
        // DuckDB handles cleanup via GC
    });

    it("can get all records", async () => {
        const result = await records.get(country);
        const rows = [...result];
        assertThat(rows.length, is(4));
    });

    it("can filter with where", async () => {
        const result = await records.get(country,
            filter(where(countryCode, is("GB"))));
        const rows = [...result];
        assertThat(rows.length, is(1));
        assertThat(rows[0].country_code, is("GB"));
        assertThat(rows[0].country_name, is("United Kingdom"));
    });

    it("can map with select", async () => {
        const result = await records.get(country,
            filter(where(countryCode, is("GB"))),
            map(select(countryCode)));
        const rows = [...result] as Pick<Country, 'country_code'>[];
        assertThat(rows.length, is(1));
        assertThat(rows[0].country_code, is("GB"));
    });

    it("supports 'and' predicates", async () => {
        const result = await records.get(country,
            filter(and(
                where(countryCode, is("GB")),
                where(countryName, is("United Kingdom"))
            )));
        const rows = [...result];
        assertThat(rows.length, is(1));
    });

    it("supports 'or' predicates", async () => {
        const result = await records.get(country,
            filter(or(
                where(countryCode, is("GB")),
                where(countryCode, is("US"))
            )));
        const rows = [...result];
        assertThat(rows.length, is(2));
    });

    it("supports between", async () => {
        const result = await records.get(country,
            filter(where(population, between(60000000, 70000000))));
        const rows = [...result];
        // GB and FR both have ~67 million
        assertThat(rows.length, is(2));
    });

    it("can use query() for async iteration", async () => {
        const rows: Country[] = [];
        for await (const row of records.query(country, filter(where(countryCode, is("DE"))))) {
            rows.push(row);
        }
        assertThat(rows.length, is(1));
        assertThat(rows[0].country_code, is("DE"));
    });
});
