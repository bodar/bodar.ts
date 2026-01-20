/**
 * @module
 *
 * Shared utilities for DuckDB WASM Connection implementations.
 */

import type {Table} from "apache-arrow";

/**
 * Converts Apache Arrow Table to array of objects.
 */
export function toObjects(table: Table): unknown[] {
    const fields = table.schema.fields.map(f => f.name);
    return table.toArray().map(row =>
        Object.fromEntries(fields.map(name => [name, row[name]]))
    );
}

/**
 * Extracts the rows changed from a DuckDB result table.
 * INSERT/DELETE/UPDATE return a table with a "Count" column containing the affected rows.
 * DDL statements return an empty table.
 */
export function getRowsChanged(table: Table): number {
    if (table.numRows === 0) return 0;
    const countField = table.schema.fields.find(f => f.name === "Count");
    if (countField) {
        const rows = table.toArray();
        return Number(rows[0]?.Count ?? 0);
    }
    return table.numRows;
}
