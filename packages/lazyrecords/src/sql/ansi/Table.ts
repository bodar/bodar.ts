import {Qualified} from "./Qualified.ts";
import {Aliasable} from "./Aliasable.ts";
import {id, Identifier} from "../template/Identifier.ts";
import {Aliased} from "./Aliased.ts";

export class Table extends Aliasable {
}

export function table(name: string | Identifier | Qualified): Table {
    return new Table(typeof name === "string" ? id(name) : name);
}

export type TableReference = Table | Aliased<Table>;
