/**
 * @module
 *
 * Converts SQL template expressions into PostgreSQL prepared statements with auto-generated names.
 *
 * Prepared statements improve performance by allowing PostgreSQL to parse and plan queries once,
 * then reuse the plan for subsequent executions. This module automatically generates unique
 * statement names using SHA-256 hashing of the SQL text (truncated to PostgreSQL's 63-character limit).
 *
 * @example
 * ```ts
 * import { prepareStatement } from "@bodar/lazyrecords/sql/postgres/prepareStatement.ts";
 * import { sql } from "@bodar/lazyrecords/sql/template/Sql.ts";
 *
 * const query = sql`select * from users where id = ${123}`;
 * const prepared = await prepareStatement(query);
 * // { name: "a1b2c3...", text: "select * from users where id = $1", args: [123] }
 * ```
 */

import {Sql} from "../template/Sql.ts";
import {statement} from "./statement.ts";

async function hashSHA256(value: string): Promise<string> {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(value);
    return hasher.digest("hex");
}

export async function prepareStatement(sql: Sql, name?: string): Promise<{ name: string; text: string; args: unknown[] }> {
    const {text, args} = statement(sql);
    return {
        name: (name ?? await hashSHA256(text)).slice(0, 63),
        text,
        args
    }
}
