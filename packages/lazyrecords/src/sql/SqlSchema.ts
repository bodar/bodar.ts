/**
 * @module
 *
 * SQL Schema implementation for database table management.
 */

import type {Schema} from "./Schema.ts";
import type {Records} from "./Records.ts";
import type {Definition} from "./builder/builders.ts";
import type {ColumnTypeMappings} from "./ColumnTypeMappings.ts";
import {CreateTableStatement} from "./ansi/CreateTableStatement.ts";
import {DropTableStatement} from "./ansi/DropTableStatement.ts";

/**
 * SqlSchema provides DDL operations for SQL databases.
 * Uses IF NOT EXISTS / IF EXISTS semantics for idempotent operations.
 */
export class SqlSchema implements Schema {
    constructor(
        private readonly records: Records,
        private readonly mappings: ColumnTypeMappings
    ) {}

    async define<A>(definition: Definition<A>): Promise<void> {
        await this.records.execute(new CreateTableStatement(definition, this.mappings));
    }

    async undefine<A>(definition: Definition<A>): Promise<void> {
        await this.records.execute(new DropTableStatement(definition));
    }
}
