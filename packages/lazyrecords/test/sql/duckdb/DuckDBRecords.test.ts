import {DuckDBInstance} from "@duckdb/node-api";
import {DuckDBRecords} from "@bodar/lazyrecords/sql/duckdb/DuckDBRecords.ts";
import {DuckDBConnection} from "@bodar/lazyrecords/sql/duckdb/DuckDBConnection.ts";
import {duckdbTransaction} from "@bodar/lazyrecords/sql/duckdb/DuckDBTransaction.ts";
import {SqlSchema} from "@bodar/lazyrecords/sql/SqlSchema.ts";
import {duckdbMappings} from "@bodar/lazyrecords/sql/duckdb/duckdbMappings.ts";
import {recordsContract} from "../RecordsContract.ts";

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
