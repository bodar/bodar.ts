import {Database} from "bun:sqlite";
import {SQLiteRecords} from "@bodar/lazyrecords/sql/sqlite/SQLiteRecords.ts";
import {recordsContract, testCountries} from "../RecordsContract.ts";

let db: Database;

recordsContract('SQLiteRecords', {
    async create() {
        db = new Database(":memory:");

        db.run(`
            CREATE TABLE country (
                country_code TEXT,
                country_name TEXT,
                population INTEGER
            )
        `);

        const insert = db.prepare("INSERT INTO country VALUES (?, ?, ?)");
        for (const c of testCountries) {
            insert.run(c.country_code, c.country_name, c.population);
        }

        return new SQLiteRecords(db);
    },
    async cleanup() {
        db.close();
    }
});

// SQLite-specific tests can go here
// describe('SQLite-specific', () => {
//     it('handles BLOB type', async () => { ... });
// });
