import {createDuckDBWasmBlocking, DuckDBWasmBlockingConnection, type DuckDBBindings, type DuckDBSyncConnection} from "@bodar/lazyrecords/sql/duckdb/DuckDBWasmBlockingConnection.ts";
import {DuckDBRecords} from "@bodar/lazyrecords/sql/duckdb/DuckDBRecords.ts";
import {duckdbTransaction} from "@bodar/lazyrecords/sql/duckdb/DuckDBTransaction.ts";
import {SqlSchema} from "@bodar/lazyrecords/sql/SqlSchema.ts";
import {duckdbMappings} from "@bodar/lazyrecords/sql/duckdb/duckdbMappings.ts";
import {recordsContract} from "../RecordsContract.ts";

let db: DuckDBBindings;
let conn: DuckDBSyncConnection;

recordsContract('DuckDBWasmBlockingRecords', {
    async create() {
        db = await createDuckDBWasmBlocking();
        conn = db.connect();
        const connection = new DuckDBWasmBlockingConnection(conn);
        const transaction = duckdbTransaction(connection);
        const records = new DuckDBRecords(connection);
        const schema = new SqlSchema(connection, duckdbMappings());
        return {records, schema, transaction};
    },
    async cleanup() {
        conn.close();
    }
});
