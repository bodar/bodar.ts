/**
 * @module
 *
 * Parser combinators for building complex parsers from simple ones. Includes sequencing, alternatives, repetition, and other composition utilities.
 */

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

/**
 * Composes two parsers, returning both results as a tuple
 *
 * @example
 * ```typescript
 * parser(regex(/\d+/), then(string('USD'))).parse(view('123USD'));
 * // Returns: [matched_number, 'USD']
 * ```
 */
export function then<A, B, C>(second: Parser<A, C>): (first: Parser<A, B>) => Parser<A, [B, C]> {
    return first => pair(first, second);
}

/**
 * Composes two parsers, discarding the first result and returning only the second
 *
 * @example
 * ```typescript
 * parser(string('$'), next(regex(/\d+/))).parse(view('$123'));
 * // Returns: matched_number (discards '$')
 * ```
 */
export function next<A, B, C>(second: Parser<A, C>): (first: Parser<A, B>) => Parser<A, C> {
    return first => parser(pair(first, second), map(([, b]) => b));
}

/**
 * Composes two parsers, keeping the first result and discarding the second
 *
 * @example
 * ```typescript
 * parser(regex(/\d+/), followedBy(string(' USD'))).parse(view('123 USD'));
 * // Returns: matched_number (discards ' USD')
 * ```
 */
export function followedBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B> {
    return first => parser(pair(first, second), map(([b, _]) => b));
}

/**
 * Ensures a parser is NOT followed by another pattern
 */
export function notFollowedBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B> {
    return followedBy(not(second));
}

/**
 * Parses multiple occurrences of a pattern separated by a delimiter
 *
 * @example
 * ```typescript
 * parser(regex(/\w+/), separatedBy(string(','))).parse(view('a,b,c'));
 * // Returns: ['a', 'b', 'c']
 * ```
 */
export function separatedBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B[]> {
    return first => parser(first, followedBy(optional(second)), many());
}

/**
 * Composes two parsers, parsing a prefix before the main parser and discarding it
 *
 * @example
 * ```typescript
 * parser(regex(/\d+/), precededBy(string('$'))).parse(view('$123'));
 * // Returns: matched_number (discards '$')
 * ```
 */
export function precededBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B> {
    return first => parser(pair(second, first), map(([_, b]) => b));
}

/**
 * Parses content between two delimiters, discarding the delimiters
 *
 * @example
 * ```typescript
 * parser(regex(/\d+/), between(string('('), string(')'))).parse(view('(123)'));
 * // Returns: matched_number (discards '(' and ')')
 * ```
 */
export function between<A, B>(before: Parser<A, any>, after: Parser<A, any> = before): (first: Parser<A, B>) => Parser<A, B> {
    return instance => parser(triple(before, instance, after), map(([_, b, __]) => b));
}

/**
 * Parses content surrounded by the same delimiter on both sides
 */
export function surroundedBy<A, B>(second: Parser<A, any>): (first: Parser<A, B>) => Parser<A, B> {
    return between(second);
}

/**
 * Transforms a parser to always return a specific value, discarding the parsed result
 */
export function returns<A, T>(value: T): (first: Parser<A, any>) => Parser<A, T> {
    return instance => parser(instance, map(() => value));
}

/**
 * Transforms a parser to return undefined, discarding the parsed result
 */
export function ignore<A>(): (first: Parser<A, any>) => Parser<A, undefined>;
export function ignore<A>(first: Parser<A, any>): Parser<A, undefined>;
export function ignore<A>(first?: Parser<A, any>): any {
    if (!first) return ignore;
    return returns<A, any>(undefined)(first);
}

type Not<T> = any extends T ? never : any;

/**
 * Parses a literal value and returns it as the specified type
 *
 * @example
 * ```typescript
 * literal(42).parse(view('42')); // Returns: 42 (as number)
 * ```
 */
export function literal<A extends Not<string>>(literal: A): Parser<string, A> {
    return parser(string(String(literal)), returns(literal));
}

/**
 * Wraps a parser with debug logging showing the parser name
 */
export function debug<A, B>(name: string): (parser: Parser<A, B>) => Parser<A, B> {
    return parser => new DebugParser(parser, name);
}

/**
 * Wraps a parser to allow optional whitespace before and after
 *
 * @example
 * ```typescript
 * whitespace(string('hello')).parse(view('  hello  ')); // Matches with surrounding whitespace
 * ```
 */
export function whitespace<A>(instance: Parser<string, A>): Parser<string, A> {
    return parser(instance, surroundedBy(many(matches(_whitespace))));
}

/**
 * Creates a parser that matches any character from the given set
 *
 * @example
 * ```typescript
 * among('abc').parse(view('b')); // Matches 'b'
 * ```
 */
export function among(characters: string): Parser<string, string> {
    return matches(_among(characters));
}

/**
 * Parses zero or more repetitions of a pattern
 *
 * @example
 * ```typescript
 * many(string('A')).parse(view('AAAB')); // Returns: ['A', 'A', 'A']
 * ```
 */
export function many<A, B>(): (parser: Parser<A, B>) => Parser<A, B[]>;
export function many<A, B>(parser: Parser<A, B>): Parser<A, B[]>;
export function many<A, B>(parser?: Parser<A, B>): any {
    if (parser) return repeat(0)(parser);
    return repeat(0)
}

/**
 * Parses one or more repetitions of a pattern
 *
 * @example
 * ```typescript
 * many1(string('A')).parse(view('AAAB')); // Returns: ['A', 'A', 'A']
 * many1(string('A')).parse(view('BBB')); // Fails (requires at least one match)
 * ```
 */
export function many1<A, B>(): (parser: Parser<A, B>) => Parser<A, B[]>;
export function many1<A, B>(parser: Parser<A, B>): Parser<A, B[]>;
export function many1<A, B>(parser?: Parser<A, B>): any {
    if (parser) return repeat(1)(parser);
    return repeat(1);
}

/**
 * Parses at least N repetitions of a pattern
 *
 * @example
 * ```typescript
 * atLeast(2)(string('A')).parse(view('AAA')); // Returns: ['A', 'A', 'A']
 * ```
 */
export function atLeast(n: number): <A, B>(parser: Parser<A, B>) => Parser<A, B[]> {
    return repeat(n);
}

/**
 * Parses at most N repetitions of a pattern
 *
 * @example
 * ```typescript
 * atMost(2)(string('A')).parse(view('AAA')); // Returns: ['A', 'A'] (stops at 2)
 * ```
 */
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