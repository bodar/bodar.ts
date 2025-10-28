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
