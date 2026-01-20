/**
 * @module
 *
 * DuckDB-specific column type mappings.
 */

import type {ColumnTypeMappings} from "@bodar/lazyrecords/sql/ColumnTypeMappings.ts";

/**
 * Creates DuckDB-specific type mappings.
 */
export function duckdbMappings(): ColumnTypeMappings {
    return new Map<Function, string>([
        [Number, 'INTEGER'],
        [BigInt, 'BIGINT'],
        [String, 'VARCHAR'],
        [Boolean, 'BOOLEAN'],
        [Date, 'TIMESTAMP'],
        [Object, 'VARCHAR'],
    ]);
}
