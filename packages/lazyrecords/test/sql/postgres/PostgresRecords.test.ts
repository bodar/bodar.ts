import {SQL} from "bun";
import {PostgresRecords} from "@bodar/lazyrecords/sql/postgres/PostgresRecords.ts";
import {PostgresConnection, type PostgresClient} from "@bodar/lazyrecords/sql/postgres/PostgresConnection.ts";
import {postgresTransaction} from "@bodar/lazyrecords/sql/postgres/PostgresTransaction.ts";
import {SqlSchema} from "@bodar/lazyrecords/sql/SqlSchema.ts";
import {postgresMappings} from "@bodar/lazyrecords/sql/postgres/postgresMappings.ts";
import {recordsContract} from "../RecordsContract.ts";

let pool: InstanceType<typeof SQL>;
let reserved: PostgresClient & { release(): void };

// Skip by default - requires running Postgres instance
// To run: remove .skip and ensure Postgres is available
recordsContract.skip('PostgresRecords', {
    async create() {
        pool = new SQL({
            username: "admin",
            password: "password",
            database: "test",
            host: "localhost",
            port: 5432,
        } as any);
        reserved = await pool.reserve() as unknown as PostgresClient & { release(): void };
        const connection = new PostgresConnection(reserved);
        const transaction = postgresTransaction(connection);
        const records = new PostgresRecords(connection);
        const schema = new SqlSchema(connection, postgresMappings());
        return {records, schema, transaction};
    },
    async cleanup() {
        reserved.release();
        await pool.end();
    }
});
