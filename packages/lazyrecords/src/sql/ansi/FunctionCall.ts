/**
 * @module
 *
 * A generic ANSI function call `name(arg, …)`. `count()` is a convenience for the
 * common `count(*)` aggregate.
 */

import {Compound, parens} from "../template/Compound.ts";
import {text} from "../template/Text.ts";
import {star} from "./Column.ts";
import type {Expression} from "../template/Expression.ts";

/** A generic SQL function call `name(arg, …)`. */
export class FunctionCall extends Compound {
    constructor(public readonly name: string, public readonly args: readonly Expression[]) {
        super([text(name), parens(args)], text(""));
    }
}

/** Creates a SQL function call `name(...args)`. */
export function functionCall(name: string, ...args: readonly Expression[]): FunctionCall {
    return new FunctionCall(name, args);
}

/** Creates a `count(expr)` aggregate; defaults to `count(*)`. */
export function count(arg: Expression = star): FunctionCall {
    return new FunctionCall('count', [arg]);
}
