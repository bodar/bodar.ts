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

export class Comment {
    constructor(public value: string) {
    }
}

export class C {
    static singleLineComment: Parser<string, string> = parser(regex(/[^\n]*/), between(string('//'), or(string('\n'), eof())));

    static multiLineComment: Parser<string, string> = parser(any<string>(), until(string('*/')), between(string('/*'), string('*/')), map(characters => characters.join('')));

    static comment: Parser<string, Comment> = parser(or(this.singleLineComment, this.multiLineComment), map(c => new Comment(c.trim())));
}