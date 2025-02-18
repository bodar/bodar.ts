import {parser} from "./Parser.ts";
import type {Parser} from "./Parser.ts";
import {map} from "../transducers/MapTransducer.ts";
import {pair, triple} from "./TupleParser.ts";
import {string} from "./StringParser.ts";
import {DebugParser} from "./DebugParser.ts";
import {optional} from "./OptionalParser.ts";
import {many} from "./ManyParser.ts";
import {pattern} from "./PatternParser.ts";
import {not} from "./NotParser.ts";
import {matches} from "./PredicatesParser.ts";
import {among as charactersAmong} from "../predicates/characters.ts";

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

const _whitespace: Parser<string, string> = pattern(/\s*/);

export function whitespace<A>(instance: Parser<string, A>): Parser<string, A> {
    return parser(instance, surroundedBy(_whitespace));
}

export const join = map((a:string[]) => a.join(''));

export function among(characters: string): Parser<string, string> {
    return parser(matches(charactersAmong(characters)), join);
}

export function manyStr(): (a: Parser<string, string>) => Parser<string, string> {
    return (a) => parser(a, many(), join);
}