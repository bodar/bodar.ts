import {describe, it} from "bun:test";
import {SQLiteRecords} from "@bodar/lazyrecords/sql/sqlite/SQLiteRecords.ts";
import {property} from "@bodar/totallylazy/functions/Property.ts";
import {filter} from "@bodar/totallylazy/transducers/FilterTransducer.ts";
import {where} from "@bodar/totallylazy/predicates/WherePredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {definition} from "@bodar/lazyrecords/sql/builder/builders.ts";
import {select} from "@bodar/totallylazy/functions/Select.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {Database} from "bun:sqlite";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

describe("SQLiteRecords", () => {
    it("can query records with get()", async () => {
        const db = new Database(":memory:");
        db.run("CREATE TABLE country (country_code TEXT, country_name TEXT)");
        db.run("INSERT INTO country VALUES (?, ?)", ["GB", "United Kingdom"]);
        db.run("INSERT INTO country VALUES (?, ?)", ["US", "United States"]);

        const records = new SQLiteRecords(db);

        interface Country {
            country_code: string;
            country_name: string;
        }

        const country = definition<Country>("country");
        const countryCode = property<Country, 'country_code'>("country_code");

        const result = await records.get(country, filter(where(countryCode, is("GB"))));

        assertThat(Array.from(result), equals([{country_code: "GB", country_name: "United Kingdom"}]));
    });

    it("can query records with async iterator", async () => {
        const db = new Database(":memory:");
        db.run("CREATE TABLE country (country_code TEXT, country_name TEXT)");
        db.run("INSERT INTO country VALUES (?, ?)", ["GB", "United Kingdom"]);
        db.run("INSERT INTO country VALUES (?, ?)", ["US", "United States"]);

        const records = new SQLiteRecords(db);

        interface Country {
            country_code: string;
            country_name: string;
        }

        const country = definition<Country>("country");
        const countryCode = property<Country, 'country_code'>("country_code");

        const query = records.query(country,
            filter(where(countryCode, is("GB"))),
            map(select(countryCode)));

        const results: Partial<Country>[] = [];
        for await (const record of query) {
            results.push(record);
        }

        assertThat(results, equals([{country_code: "GB"}]));
    });
});
