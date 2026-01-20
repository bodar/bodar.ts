import {Database} from "bun:sqlite";
import {SQLiteRecords} from "@bodar/lazyrecords/sql/sqlite/SQLiteRecords.ts";
import {SQLiteConnection} from "@bodar/lazyrecords/sql/sqlite/SQLiteConnection.ts";
import {sqliteTransaction} from "@bodar/lazyrecords/sql/sqlite/SQLiteTransaction.ts";
import {SqlSchema} from "@bodar/lazyrecords/sql/SqlSchema.ts";
import {sqliteMappings} from "@bodar/lazyrecords/sql/sqlite/sqliteMappings.ts";
import {recordsContract} from "@bodar/lazyrecords/sql/testing/RecordsContract.ts";

let db: Database;

recordsContract('SQLiteRecords', {
    async create() {
        db = new Database(":memory:");
        const connection = new SQLiteConnection(db);
        const transaction = sqliteTransaction(connection);
        const records = new SQLiteRecords(connection);
        const schema = new SqlSchema(connection, sqliteMappings());
        return {records, schema, transaction};
    },
    async cleanup() {
        db.close();
    }
});
