/**
 * @module
 *
 * ANSI SQL qualified names (schema.table or table.column) for explicit object references.
 */

import {Compound} from "../template/Compound.ts";
import {empty, text, Text} from "../template/Text.ts";
import {id} from "../template/Identifier.ts";

export class Qualified extends Compound {
    static dot: Text = text(".");

    constructor(public readonly qualifier: string, public readonly name: string,) {
        super([id(qualifier), Qualified.dot, id(name)], empty);
    }
}

export function qualified(qualifier: string, name: string): Qualified {
    return new Qualified(qualifier, name);
}