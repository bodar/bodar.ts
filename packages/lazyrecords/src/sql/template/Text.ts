/**
 * @module
 *
 * Raw SQL text expressions without parameters or placeholders.
 */

import {Expression} from "./Expression.ts";

/**
 * A raw text expression. Will not have any placeholders or values
 *
 * Does not need to be escaped as this will be done by the specific database function.
 */
export class Text extends Expression {
    constructor(public readonly text: string) {
        super();
    }
}

/**
 * Create a Text expression from a string.
 */
export function text(text: string): Text {
    if(text === '') return empty;
    if(text === ' ') return space;
    return new Text(text);
}

/**
 * Alias for text.
 */
export const raw = text;

/**
 * An empty text expression.
 */
export const empty: Text = new Text('');

/**
 * A space text expression.
 */
export const space: Text = new Text(' ');
