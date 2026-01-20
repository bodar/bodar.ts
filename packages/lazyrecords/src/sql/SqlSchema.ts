/**
 * @module
 *
 * SQL Schema implementation for database table management.
 */

import type {Connection} from "./Connection.ts";
import type {Definition} from "./builder/builders.ts";
import type {ColumnTypeMappings} from "./ColumnTypeMappings.ts";
import {CreateTableStatement} from "./ansi/CreateTableStatement.ts";
import {DropTableStatement} from "./ansi/DropTableStatement.ts";
import type {Schema} from "../Schema.ts";

/**
 * SqlSchema provides DDL operations for SQL databases.
 * Uses IF NOT EXISTS / IF EXISTS semantics for idempotent operations.
 */
export class SqlSchema implements Schema {
    constructor(
        private readonly connection: Connection,
        private readonly mappings: ColumnTypeMappings
    ) {}

    async define<A>(definition: Definition<A>): Promise<void> {
        await this.connection.execute(new CreateTableStatement(definition, this.mappings));
    }

    async undefine<A>(definition: Definition<A>): Promise<void> {
        await this.connection.execute(new DropTableStatement(definition));
    }
}
