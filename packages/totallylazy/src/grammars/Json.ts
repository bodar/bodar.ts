import type {Parser} from "../parsers/Parser.ts";
import {parser} from "../parsers/Parser.ts";
import {string} from "../parsers/StringParser.ts";
import {
    among,
    between,
    literal,
    manyStr,
    next,
    separatedBy,
    surroundedBy,
    then,
    whitespace
} from "../parsers/parsers.ts";
import {or} from "../parsers/OrParser.ts";
import {map} from "../transducers/MapTransducer.ts";
import {pattern} from "../parsers/PatternParser.ts";
import type {JsonValue} from "./types.ts";
import {triple} from "../parsers/TupleParser.ts";
import {lazy} from "../functions/lazy.ts";
import {optional} from "../parsers/OptionalParser.ts";
import {C} from "./C.ts";
import {Jsdoc, JsdocComment} from "./Jsdoc.ts";

export class Json {
    static null: Parser<string, null> = literal(null);

    static boolean: Parser<string, boolean> = or(literal(true), literal(false));

    static escaped: Parser<string, string> = parser(string('\\'), next(or(
        among("\"\\/"),
        parser(among("bfnrt"), map(unescape)),
        parser(pattern(/u[0-9a-fA-F]{4}/), map(u => String.fromCharCode(parseInt(u.slice(1), 16))))
    )));

    static characters: Parser<string, string> = pattern(/[^"\\]+/);

    static string: Parser<string, string> = parser(this.characters, or(this.escaped), manyStr(), surroundedBy(string('"')));

    static number: Parser<string, number> = parser(pattern(/[-+eE.\d]+/), map(Number));

    static whitespace<A>(instance: Parser<string, A>) {
        return parser(whitespace(instance), surroundedBy(optional(C.comment)));
    }

    static value(global: any = globalThis): Parser<string, JsonValue> {
        return lazy(() => or(this.custom(global), this.whitespace(or(this.object, this.array, this.string, this.number, this.boolean, this.null))));
    }

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