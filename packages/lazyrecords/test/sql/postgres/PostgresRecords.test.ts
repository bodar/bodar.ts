import {SQL} from "bun";
import {PostgresRecords} from "@bodar/lazyrecords/sql/postgres/PostgresRecords.ts";
import {recordsContract, testCountries} from "../RecordsContract.ts";

let client: InstanceType<typeof SQL>;

// Skip by default - requires running Postgres instance
// To run: remove .skip and ensure Postgres is available
recordsContract.skip('PostgresRecords', {
    async create() {
        client = new SQL({
            username: "admin",
            password: "password",
            database: "test",
            host: "localhost",
            port: 5432,
        } as any);
        await client.connect();

        await client.unsafe(`
            DROP TABLE IF EXISTS country;
            CREATE TABLE country (
                country_code VARCHAR,
                country_name VARCHAR,
                population INTEGER
            )
        `);

        const values = testCountries
            .map(c => `('${c.country_code}', '${c.country_name}', ${c.population})`)
            .join(', ');
        await client.unsafe(`INSERT INTO country VALUES ${values}`);

        return new PostgresRecords(client);
    },
    async cleanup() {
        await client.end();
    }
});

// Postgres-specific tests can go here
// describe('Postgres-specific', () => {
//     it('supports JSONB', async () => { ... });
// });
