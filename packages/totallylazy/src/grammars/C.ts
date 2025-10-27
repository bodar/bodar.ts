/**
 * @module
 *
 * C-style comment grammar parser supporting single-line and multi-line comments.
 */

import {parser} from "../parsers/Parser.ts";
import type {Parser} from "../parsers/Parser.ts";
import {string} from "../parsers/StringParser.ts";
import {or} from "../parsers/OrParser.ts";
import {regex} from "../parsers/RegexParser.ts";
import {between} from "../parsers/parsers.ts";
import {eof} from "../parsers/EofParser.ts";
import {any} from "../parsers/AnyParser.ts";
import {until} from "../parsers/UntilParser.ts";
import {map} from "../transducers/MapTransducer.ts";

/**
 * Represents a parsed C-style comment
 *
 * @example
 * ```typescript
 * import { C } from "@bodar/totallylazy/grammars/C.ts";
 * import { view } from "@bodar/totallylazy/parsers/View.ts";
 *
 * const singleLine = C.comment.parse(view('// This is a comment\n'));
 * singleLine.value; // Comment with value: 'This is a comment'
 *
 * const multiLine = C.comment.parse(view('/＊ Multi-line comment ＊/'));
 * multiLine.value; // Comment with value: 'Multi-line comment'
 * ```
 */
export class Comment {
    constructor(public value: string) {
    }
}

export class C {
    static singleLineComment: Parser<string, string> = parser(regex(/[^\n]*/), between(string('//'), or(string('\n'), eof())));

    static multiLineComment: Parser<string, string> = parser(any<string>(), until(string('*/')), between(string('/*'), string('*/')), map(characters => characters.join('')));

    static comment: Parser<string, Comment> = parser(or(this.singleLineComment, this.multiLineComment), map(c => new Comment(c.trim())));
}