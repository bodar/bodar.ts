import type {Connection} from "./Connection.ts";
import type {Compound} from "./template/Compound.ts";
import type {Transaction} from "../Transaction.ts";

/**
 * SQL Transaction implementation that uses a Connection for executing transaction commands.
 */
export class SqlTransaction implements Transaction {
    constructor(
        private readonly connection: Connection,
        private readonly beginSql: Compound,
        private readonly commitSql: Compound,
        private readonly rollbackSql: Compound
    ) {
    }

    async begin(): Promise<void> {
        await this.connection.execute(this.beginSql);
    }

    async commit(): Promise<void> {
        await this.connection.execute(this.commitSql);
    }

    async rollback(): Promise<void> {
        await this.connection.execute(this.rollbackSql);
    }
}