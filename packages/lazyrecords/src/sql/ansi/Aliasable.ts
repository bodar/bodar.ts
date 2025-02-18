import {Expression} from "../template/Expression.ts";
import {Aliased} from "./Aliased.ts";
import {Compound} from "../template/Compound.ts";

export class Aliasable extends Compound {
    constructor(public readonly expression: Expression) {
        super([expression]);
    }

    as(alias: string): Aliased<this> {
        return new Aliased<this>(this, alias);
    }
}