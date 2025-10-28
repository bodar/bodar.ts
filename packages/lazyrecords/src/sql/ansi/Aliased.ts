/**
 * @module
 *
 * ANSI SQL aliased expressions combining a value with its alias name.
 */

import {Compound} from "../template/Compound.ts";
import {Expression} from "../template/Expression.ts";
import {text, Text} from "../template/Text.ts";
import {id} from "../template/Identifier.ts";

export class Aliased<T extends Expression> extends Compound {
    static as: Text = text("as");

    constructor(public readonly expression: T, public readonly alias: string) {
        super([expression, Aliased.as, id(alias)]);
    }
}