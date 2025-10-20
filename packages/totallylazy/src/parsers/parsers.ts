import type {Parser} from "./Parser.ts";
import {parser} from "./Parser.ts";
import {map} from "../transducers/MapTransducer.ts";
import {pair, triple} from "./ListParser.ts";
import {string} from "./StringParser.ts";
import {DebugParser} from "./DebugParser.ts";
import {optional} from "./OptionalParser.ts";
import {not} from "./NotParser.ts";
import {matches} from "./PredicatesParser.ts";
import {among as _among} from "../predicates/AmongPredicate.ts";
import {whitespace as _whitespace} from "../predicates/characters.ts";
import {repeat} from "./RepeatParser.ts";

export function then<A, B, C>(second: Parser<A, C>): (first: Parser<A, B>) => Parser<A, [B, C]> {
    return first => pair(first, second);
}

export function next<A, B, C>(second: Parser<A, C>): (first: Parser<A, B>) => Parser<A, C> {
    return first => parser(pair(first, second), map(([, b]) => b));
}

export function followedBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B> {
    return first => parser(pair(first, second), map(([b, _]) => b));
}

export function notFollowedBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B> {
    return followedBy(not(second));
}

export function separatedBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B[]> {
    return first => parser(first, followedBy(optional(second)), many());
}

export function precededBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B> {
    return first => parser(pair(second, first), map(([_, b]) => b));
}

export function between<A, B>(before: Parser<A, any>, after: Parser<A, any> = before): (first: Parser<A, B>) => Parser<A, B> {
    return instance => parser(triple(before, instance, after), map(([_, b, __]) => b));
}

export function surroundedBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B> {
    return between(second);
}

export function returns<A, T>(value: T): (first: Parser<A, any>) => Parser<A, T> {
    return instance => parser(instance, map(() => value));
}

export function ignore<A>(): (first: Parser<A, any>) => Parser<A, undefined>;
export function ignore<A>(first: Parser<A, any>): Parser<A, undefined>;
export function ignore<A>(first?: Parser<A, any>): any {
    if (!first) return ignore;
    return returns<A, any>(undefined)(first);
}

type Not<T> = any extends T ? never : any;

export function literal<A extends Not<string>>(literal: A): Parser<string, A> {
    return parser(string(String(literal)), returns(literal));
}

export function debug<A, B>(name: string): (parser: Parser<A, B>) => Parser<A, B> {
    return parser => new DebugParser(parser, name);
}

export function whitespace<A>(instance: Parser<string, A>): Parser<string, A> {
    return parser(instance, surroundedBy(many(matches(_whitespace))));
}

export function among(characters: string): Parser<string, string> {
    return matches(_among(characters));
}

export function many<A, B>(): (parser: Parser<A, B>) => Parser<A, B[]>;
export function many<A, B>(parser: Parser<A, B>): Parser<A, B[]>;
export function many<A, B>(parser?: Parser<A, B>): any {
    if (parser) return repeat(0)(parser);
    return repeat(0)
}

export function many1<A, B>(): (parser: Parser<A, B>) => Parser<A, B[]>;
export function many1<A, B>(parser: Parser<A, B>): Parser<A, B[]>;
export function many1<A, B>(parser?: Parser<A, B>): any {
    if (parser) return repeat(1)(parser);
    return repeat(1);
}

export function atLeast(n: number): <A, B>(parser: Parser<A, B>) => Parser<A, B[]> {
    return repeat(n);
}

export function atMost(n: number): <A, B>(parser: Parser<A, B>) => Parser<A, B[]> {
    return repeat(0, n);
}

/**
 * Repeat a parser exactly N times.
 * Similar to regex {n} quantifier.
 *
 * @example
 * // Parse exactly 4 hex digits: /[0-9a-fA-F]{4}/
 * parser(among('0123456789abcdefABCDEF'), times(4))
 */
export function times<A, B>(count: number): (parser: Parser<A, B>) => Parser<A, B[]> {
    return repeat(count, count);
}