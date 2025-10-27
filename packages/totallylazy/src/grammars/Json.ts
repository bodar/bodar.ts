/**
 * @module
 *
 * JSON grammar parser with support for comments and custom type constructors via JSDoc annotations.
 */

import type {Parser} from "../parsers/Parser.ts";
import {parser} from "../parsers/Parser.ts";
import {string} from "../parsers/StringParser.ts";
import {
    among,
    between,
    literal, many,
    next,
    separatedBy,
    surroundedBy,
    then,
    whitespace
} from "../parsers/parsers.ts";
import {or} from "../parsers/OrParser.ts";
import {map} from "../transducers/MapTransducer.ts";
import {regex} from "../parsers/RegexParser.ts";
import type {JsonValue} from "./types.ts";
import {triple} from "../parsers/ListParser.ts";
import {lazy} from "../functions/lazy.ts";
import {optional} from "../parsers/OptionalParser.ts";
import {C} from "./C.ts";
import {Jsdoc, JsdocComment} from "./Jsdoc.ts";

/**
 * JSON grammar parser with support for comments and custom type constructors.
 *
 * Provides parsers for all JSON value types (null, boolean, string, number, array, object)
 * plus support for C-style comments and JSDoc-annotated custom type constructors.
 *
 * @example
 * ```typescript
 * import { Json } from "@bodar/totallylazy/grammars/Json.ts";
 * import { view } from "@bodar/totallylazy/parsers/View.ts";
 *
 * // Parse basic values
 * Json.null.parse(view('null')).value; // null
 * Json.boolean.parse(view('true')).value; // true
 * Json.number.parse(view('42')).value; // 42
 *
 * // Parse with comments
 * Json.value().parse(view('// comment\n "hello"')).value; // "hello"
 *
 * // Parse custom types with JSDoc annotations
 * const input = '/** @type {Map} *' + '/ [["key", "value"]]';
 * const map = Json.value().parse(view(input)).value;
 * map.get('key'); // "value"
 * ```
 */
export class Json {
    /** Parser for JSON null value */
    static null: Parser<string, null> = literal(null);

    /** Parser for JSON boolean values (true/false) */
    static boolean: Parser<string, boolean> = or(literal(true), literal(false));

    /** Parser for escaped characters in JSON strings */
    static escaped: Parser<string, string> = parser(string('\\'), next(or(
        among("\"\\/"),
        parser(among("bfnrt"), map(unescape)),
        parser(regex(/u[0-9a-fA-F]{4}/), map(u => String.fromCharCode(parseInt(u.slice(1), 16))))
    )));

    /** Parser for unescaped characters in JSON strings */
    static characters: Parser<string, string> = regex(/[^"\\]+/);

    /** Parser for JSON string values (quoted text with escape sequences) */
    static string: Parser<string, string> = parser(many(or(this.characters, this.escaped)), map((characters: string[]) => characters.join("")), surroundedBy(string('"')));

    /** Parser for JSON number values (integers and decimals) */
    static number: Parser<string, number> = parser(regex(/[-+eE.\d]+/), map(Number));

    /** Wraps a parser to handle optional whitespace and C-style comments */
    static whitespace<A>(instance: Parser<string, A>): Parser<string, A> {
        return parser(whitespace(instance), surroundedBy(optional(C.comment)));
    }

    /**
     * Parser for any JSON value with whitespace and comment support
     * @param global - Global object to resolve custom type constructors from JSDoc annotations
     */
    static value(global: any = globalThis): Parser<string, JsonValue> {
        return lazy(() => or(this.custom(global), this.whitespace(or(this.object, this.array, this.string, this.number, this.boolean, this.null))));
    }

    /**
     * Parser for custom type constructors via JSDoc annotations
     * @param global - Global object to resolve custom type constructors
     */
    static custom(global: any = globalThis): Parser<string, any> {
        return parser(Jsdoc.jsdoc, then(this.value()), map(([jsdoc, value]: [JsdocComment, JsonValue]) => {
            const constructor = global[jsdoc.tags.type!];
            return constructor ? Reflect.construct(constructor, [value]) : value;
        }));
    }

    static array: Parser<string, JsonValue[]> = parser(this.value(), separatedBy(string(',')),
        between(string('['), string(']')));

    static member: Parser<string, [string, JsonValue]> = parser(triple(this.whitespace(this.string), string(':'), this.value()),
        map(([key, , value]) => [key, value]));

    static object: Parser<string, JsonValue> = parser(this.member, separatedBy(string(',')),
        between(string('{'), string('}')), map(Object.fromEntries));
}

function unescape(escaped: 'b' | 'n' | 'r' | 't' | 'f'): string {
    switch (escaped) {
        case 'b':
            return '\b';
        case 'n':
            return '\n';
        case 'r':
            return '\r';
        case 't':
            return '\t';
        case 'f':
            return '\f';
        default:
            throw new Error(`Should never happen: ${escaped}`);
    }
}