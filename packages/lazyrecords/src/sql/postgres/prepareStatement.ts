/**
 * @module
 *
 * Converts SQL template expressions into PostgreSQL prepared statements with auto-generated names.
 * Statement names are generated using SHA-256 hashing of the SQL text, truncated to PostgreSQL's 63-character limit.
 */

import {Sql} from "../template/Sql.ts";
import {statement} from "../statement/numberedPlaceholder.ts";

async function hashSHA256(value: string): Promise<string> {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(value);
    return hasher.digest("hex");
}

/** Converts SQL template into a PostgreSQL prepared statement with auto-generated or custom name. */
export async function prepareStatement(sql: Sql, name?: string): Promise<{ name: string; text: string; args: unknown[] }> {
    const {text, args} = statement(sql);
    return {
        name: (name ?? await hashSHA256(text)).slice(0, 63),
        text,
        args
    }
}
