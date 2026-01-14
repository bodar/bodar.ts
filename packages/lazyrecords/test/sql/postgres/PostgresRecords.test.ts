import {SQL} from "bun";
import {PostgresRecords} from "@bodar/lazyrecords/sql/postgres/PostgresRecords.ts";
import {SqlSchema} from "@bodar/lazyrecords/sql/SqlSchema.ts";
import {postgresMappings} from "@bodar/lazyrecords/sql/postgres/postgresMappings.ts";
import {recordsContract} from "../RecordsContract.ts";

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
        const records = new PostgresRecords(client);
        const schema = new SqlSchema(records, postgresMappings());
        return {records, schema};
    },
    async cleanup() {
        await client.end();
    }
});

// Postgres-specific tests can go here
// describe('Postgres-specific', () => {
//     it('supports JSONB', async () => { ... });
// });
