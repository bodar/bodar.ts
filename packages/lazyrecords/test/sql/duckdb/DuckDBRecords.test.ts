import {DuckDBInstance} from "@duckdb/node-api";
import {DuckDBRecords} from "@bodar/lazyrecords/sql/duckdb/DuckDBRecords.ts";
import {SqlSchema} from "@bodar/lazyrecords/sql/SqlSchema.ts";
import {duckdbMappings} from "@bodar/lazyrecords/sql/duckdb/duckdbMappings.ts";
import {recordsContract} from "../RecordsContract.ts";

let instance: DuckDBInstance;
let connection: Awaited<ReturnType<DuckDBInstance['connect']>>;

recordsContract('DuckDBRecords', {
    async create() {
        instance = await DuckDBInstance.create(':memory:');
        connection = await instance.connect();
        const records = new DuckDBRecords(connection);
        const schema = new SqlSchema(records, duckdbMappings());
        return {records, schema};
    },
    async cleanup() {
        // DuckDB handles cleanup via GC
    }
});

// DuckDB-specific tests can go here
// describe('DuckDB-specific', () => {
//     it('supports ARRAY types', async () => { ... });
// });
