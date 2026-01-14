/**
 * @module
 *
 * Column type mappings from JavaScript constructors to SQL types.
 */

/** Maps JavaScript constructor types to SQL type strings */
export type ColumnTypeMappings = Map<Function, string>;

/**
 * Creates ANSI SQL standard type mappings.
 * Can be extended or overridden for specific databases.
 */
export function ansiMappings(): ColumnTypeMappings {
    return new Map<Function, string>([
        [Number, 'integer'],
        [BigInt, 'bigint'],
        [String, 'text'],
        [Boolean, 'boolean'],
        [Date, 'timestamp'],
        [Object, 'text'],
    ]);
}

/**
 * Looks up the SQL type for a JavaScript constructor.
 * Falls back to Object mapping if type not found.
 */
export function sqlType(type: Function, mappings: ColumnTypeMappings): string {
    return mappings.get(type) ?? mappings.get(Object) ?? 'text';
}
