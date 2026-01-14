/**
 * @module
 *
 * PostgreSQL-specific column type mappings.
 */

import {ansiMappings, type ColumnTypeMappings} from "../ColumnTypeMappings.ts";

/**
 * Creates PostgreSQL-specific type mappings.
 */
export function postgresMappings(): ColumnTypeMappings {
    return ansiMappings();  // PostgreSQL follows ANSI closely
}
