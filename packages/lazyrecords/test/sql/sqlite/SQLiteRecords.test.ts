import {Database} from "bun:sqlite";
import {SQLiteRecords} from "@bodar/lazyrecords/sql/sqlite/SQLiteRecords.ts";
import {SqlSchema} from "@bodar/lazyrecords/sql/SqlSchema.ts";
import {sqliteMappings} from "@bodar/lazyrecords/sql/sqlite/sqliteMappings.ts";
import {recordsContract} from "../RecordsContract.ts";

let db: Database;

recordsContract('SQLiteRecords', {
    async create() {
        db = new Database(":memory:");
        const records = new SQLiteRecords(db);
        const schema = new SqlSchema(records, sqliteMappings());
        return {records, schema};
    },
    async cleanup() {
        db.close();
    }
});

// SQLite-specific tests can go here
// describe('SQLite-specific', () => {
//     it('handles BLOB type', async () => { ... });
// });
