import {Compound} from "../template/Compound.ts";
import {text} from "../template/Text.ts";
import {Table} from "./Table.ts";

export class SelectList extends Compound {
    constructor(public readonly tables: Table[]) {
        super(tables, text(", "));
    }
}