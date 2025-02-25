import {describe, it} from "bun:test";
import {PostgresRecords} from "@bodar/lazyrecords/sql/postgres/PostgresRecords";
import {property} from "@bodar/totallylazy/functions/Property";
import {filter} from "@bodar/totallylazy/transducers/FilterTransducer";
import {where} from "@bodar/totallylazy/predicates/WherePredicate";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {definition} from "@bodar/lazyrecords/sql/builder/builders";
import {select} from "@bodar/totallylazy/functions/Select";
import {map} from "@bodar/totallylazy/transducers/MapTransducer";
import {SQL} from "bun";


describe("PostgresRecords", () => {
    it.skip("can query records", async () => {
        const client = new SQL({
            username: "admin",
            password: "password",
            database: "slipway",
            host: "localhost",
            port: 5432,
        } as any);
        await client.connect();

        const records = new PostgresRecords(client);

        interface Country {
            country_code: string;
            country_name: string;
        }

        const country = definition<Country>("country");
        const countryCode = property<Country, 'country_code'>("country_code");
        // const countryName = property<Country, 'country_name'>("country_name");

        try {
            const query = records.query(country,
                filter(where(countryCode, is("GB"))),
                map(select(countryCode)));

            for await (const record of query) {
                console.log(record);
            }
        } finally {
            await client.end();
        }
    });
});