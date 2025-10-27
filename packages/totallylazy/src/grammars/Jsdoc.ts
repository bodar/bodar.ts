/**
 * @module
 *
 * JSDoc comment grammar parser for extracting type annotations and tags.
 */

import {parser} from "../parsers/Parser.ts";
import type {Parser} from "../parsers/Parser.ts";
import {string} from "../parsers/StringParser.ts";
import {regex} from "../parsers/RegexParser.ts";
import {between, many, next, then, whitespace as ws} from "../parsers/parsers.ts";
import {map} from "../transducers/MapTransducer.ts";

/**
 * JSDoc tag annotations extracted from comments
 */
export interface JsdocTags {
    /** The type annotation from the @type tag */
    type: string;
}

/**
 * Represents a parsed JSDoc comment with its tags
 *
 * @example
 * ```typescript
 * import { Jsdoc } from "@bodar/totallylazy/grammars/Jsdoc.ts";
 * import { view } from "@bodar/totallylazy/parsers/View.ts";
 *
 * const result = Jsdoc.jsdoc.parse(view('/＊＊ @type {Map} ＊/'));
 * result.value; // JsdocComment with tags: { type: 'Map' }
 * ```
 */
export class JsdocComment {
    constructor(public tags: Partial<JsdocTags>) {
    }
}

/** JSDoc comment grammar parser for extracting type annotations */
export class Jsdoc {
    /** Parser for type expressions in curly braces */
    static typeExpression: Parser<string, string> = parser(regex(/[a-zA-Z]+/), between(string('{'), string('}')));

    /** Parser for @type tag with its type expression */
    static type: Parser<string, ['type', string]> = parser(ws(parser(string('@'), next(string('type')))), then(ws(Jsdoc.typeExpression)));

    /** Parser for JSDoc tags, returning an object with tag names as keys */
    static tags: Parser<string, Partial<JsdocTags>> = parser(Jsdoc.type, many(), map(Object.fromEntries));

    /** Parser for complete JSDoc comments */
    static jsdoc: Parser<string, JsdocComment> = parser(Jsdoc.tags, between(string('/**'), string('*/')), map(c => new JsdocComment(c)));
}
