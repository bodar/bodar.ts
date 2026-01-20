import {DuckDBInstance} from "@duckdb/node-api";
import {DuckDBRecords} from "../src/DuckDBRecords.ts";
import {DuckDBConnection} from "../src/DuckDBConnection.ts";
import {duckdbTransaction} from "../src/DuckDBTransaction.ts";
import {SqlSchema} from "@bodar/lazyrecords/sql/SqlSchema.ts";
import {duckdbMappings} from "../src/duckdbMappings.ts";
import {recordsContract} from "@bodar/lazyrecords/sql/testing/RecordsContract.ts";

let instance: DuckDBInstance;

recordsContract('DuckDBRecords', {
    async create() {
        instance = await DuckDBInstance.create(':memory:');
        const native = await instance.connect();
        const connection = new DuckDBConnection(native);
        const transaction = duckdbTransaction(connection);
        const records = new DuckDBRecords(connection);
        const schema = new SqlSchema(connection, duckdbMappings());
        return {records, schema, transaction};
    },
    async cleanup() {
        // DuckDB handles cleanup via GC
    }
});
