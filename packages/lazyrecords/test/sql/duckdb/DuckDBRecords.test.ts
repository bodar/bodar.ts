import {DuckDBInstance} from "@duckdb/node-api";
import {DuckDBRecords} from "@bodar/lazyrecords/sql/duckdb/DuckDBRecords.ts";
import {recordsContract, testCountries} from "../RecordsContract.ts";

let instance: DuckDBInstance;
let connection: Awaited<ReturnType<DuckDBInstance['connect']>>;

recordsContract('DuckDBRecords', {
    async create() {
        instance = await DuckDBInstance.create(':memory:');
        connection = await instance.connect();

        await connection.run(`
            CREATE TABLE country (
                country_code VARCHAR,
                country_name VARCHAR,
                population INTEGER
            )
        `);

        const values = testCountries
            .map(c => `('${c.country_code}', '${c.country_name}', ${c.population})`)
            .join(', ');
        await connection.run(`INSERT INTO country VALUES ${values}`);

        return new DuckDBRecords(connection);
    },
    async cleanup() {
        // DuckDB handles cleanup via GC
    }
});

// DuckDB-specific tests can go here
// describe('DuckDB-specific', () => {
//     it('supports ARRAY types', async () => { ... });
// });
