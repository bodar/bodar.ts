/**
 * @module
 *
 * Schema interface for database table management operations.
 */



import type {Definition} from "./sql/builder/builders.ts";

/**
 * Schema interface for type-safe database schema management.
 * Implementations include SqlSchema for SQL databases.
 */
export interface Schema {
    /**
     * Defines (creates) a table in the database based on the provided definition.
     * Uses IF NOT EXISTS semantics - safe to call multiple times.
     *
     * @param definition - The table definition including name and typed fields.
     */
    define<A>(definition: Definition<A>): Promise<void>;

    /**
     * Undefines (drops) a table from the database.
     * Uses IF EXISTS semantics - safe to call even if table doesn't exist.
     *
     * @param definition - The table definition to drop.
     */
    undefine<A>(definition: Definition<A>): Promise<void>;
}