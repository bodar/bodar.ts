import {Sql} from "../template/Sql";
import {statement} from "./statement";

async function hashSHA256(value: string): Promise<string> {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(value);
    return hasher.digest("hex");
}

export async function prepareStatement(sql: Sql, name?: string) {
    const {text, args} = statement(sql);
    return {
        name: (name ?? await hashSHA256(text)).slice(0, 63),
        text,
        args
    }
}
