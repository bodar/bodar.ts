import {Compound} from "../template/Compound.ts";
import {Expression} from "../template/Expression.ts";
import {text} from "../template/Text.ts";
import {id} from "../template/Identifier.ts";

export class Aliased<T extends Expression> extends Compound {
    static as = text("as");

    constructor(public readonly expression: T, public readonly alias: string) {
        super([expression, Aliased.as, id(alias)]);
    }
}