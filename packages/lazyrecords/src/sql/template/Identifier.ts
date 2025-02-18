import {Expression} from "./Expression.ts";

/**
 * An identifier is a name that is used to identify a variable, function, table, or any other object in a database.
 */
export class Identifier extends Expression {
    constructor(public readonly identifier: string) {
        super();
    }
}

/**
 * Create an Identifier from a string.
 */
export function id(identifier: string): Identifier {
    return new Identifier(identifier);
}