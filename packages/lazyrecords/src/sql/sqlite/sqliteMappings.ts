/**
 * @module
 *
 * SQLite-specific column type mappings.
 */

import type {ColumnTypeMappings} from "../ColumnTypeMappings.ts";

/**
 * Creates SQLite-specific type mappings.
 * SQLite has dynamic typing, but these are conventional type affinities.
 */
export function sqliteMappings(): ColumnTypeMappings {
    return new Map<Function, string>([
        [Number, 'INTEGER'],
        [BigInt, 'INTEGER'],
        [String, 'TEXT'],
        [Boolean, 'INTEGER'],  // SQLite uses 0/1 for booleans
        [Date, 'TEXT'],        // SQLite stores dates as ISO strings or unix timestamps
        [Object, 'TEXT'],
    ]);
}
