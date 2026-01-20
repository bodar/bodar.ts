import {createDuckDBWasmBlocking, DuckDBWasmBlockingConnection, type DuckDBBindings, type DuckDBSyncConnection} from "../src/DuckDBWasmBlockingConnection.ts";
import {DuckDBWasmRecords} from "../src/DuckDBWasmRecords.ts";
import {duckdbWasmTransaction} from "../src/DuckDBWasmTransaction.ts";
import {SqlSchema} from "@bodar/lazyrecords/sql/SqlSchema.ts";
import {duckdbMappings} from "../src/duckdbMappings.ts";
import {recordsContract} from "@bodar/lazyrecords/sql/testing/RecordsContract.ts";

let db: DuckDBBindings;
let conn: DuckDBSyncConnection;

recordsContract('DuckDBWasmBlockingRecords', {
    async create() {
        db = await createDuckDBWasmBlocking();
        conn = db.connect();
        const connection = new DuckDBWasmBlockingConnection(conn);
        const transaction = duckdbWasmTransaction(connection);
        const records = new DuckDBWasmRecords(connection);
        const schema = new SqlSchema(connection, duckdbMappings());
        return {records, schema, transaction};
    },
    async cleanup() {
        conn.close();
    }
});
