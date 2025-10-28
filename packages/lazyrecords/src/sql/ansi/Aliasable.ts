/**
 * @module
 *
 * ANSI SQL aliasing support for tables and columns using AS keyword.
 */

import {Expression} from "../template/Expression.ts";
import {Aliased} from "./Aliased.ts";
import {Compound} from "../template/Compound.ts";

/** Base class for SQL expressions that can be aliased using AS keyword. */
export class Aliasable extends Compound {
    constructor(public readonly expression: Expression) {
        super([expression]);
    }

    as(alias: string): Aliased<this> {
        return new Aliased<this>(this, alias);
    }
}