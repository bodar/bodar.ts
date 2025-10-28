/** @module Core parser type and combinators */
import {result} from "./Result.ts";
import type {Result} from "./Result.ts";
import type {View} from "./View.ts";
import {Transducer} from "../transducers/Transducer.ts";
import {flatten} from "../transducers/CompositeTransducer.ts";

/**
 * A parser that consumes input of type A and produces a result of type B
 */
export interface Parser<A, B> {
    /**
     * Parses the input view and returns a result
     */
    parse(input: View<A>): Result<A, B>;
}

/**
 * A parser that applies transducers to transform the parsed result
 */
export class TransducingParser<A, B> implements Parser<A, B> {
    private constructor(private readonly parser: Parser<any, any>,
                        private readonly transducers: readonly Transducer<any, any>[]) {
    }

    /**
     * Creates a transducing parser from a base parser and transducers
     */
    static create<A, B>(parser: Parser<any, any>, ...transducers: readonly Transducer<any, any>[]): TransducingParser<A, B> {
        if (parser instanceof TransducingParser) return TransducingParser.create(parser.parser, ...[...parser.transducers, ...transducers]);
        return new TransducingParser(parser, flatten(transducers));
    }

    parse(input: View<A>): Result<A, B> {
        return result(this.parser.parse(input), ...this.transducers);
    }
}

/**
 * A function that transforms a parser into another parser
 */
export type Transformer<A, B, C> = (a: Parser<A, B>) => Parser<A, C>;

/**
 * Either a transformer or a transducer that can be applied to a parser
 */
export type Step<A, B, C> = Transformer<A, B, C> | Transducer<B, C>;

/**
 * Composes a parser with transformers and transducers to create a parsing pipeline.
 * This is the main function for building complex parsers from simpler ones.
 *
 * @example
 * ```ts
 * const digitParser = matches(digit);
 * const numberParser = parser(digitParser, map(Number));
 * ```
 */
export function parser<A, B>(a: Parser<A, B>): Parser<A, B>;
export function parser<A, B, C>(a: Parser<A, B>, b: Step<A, B, C>): Parser<A, C>;
export function parser<A, B, C, D>(a: Parser<A, B>, b: Step<A, B, C>, c: Step<A, C, D>): Parser<A, D>;
export function parser<A, B, C, D, E>(a: Parser<A, B>, b: Step<A, B, C>, c: Step<A, C, D>, d: Step<A, D, E>): Parser<A, E>;
export function parser<A, B, C, D, E, F>(a: Parser<A, B>, b: Step<A, B, C>, c: Step<A, C, D>, d: Step<A, D, E>, e: Step<A, E, F>): Parser<A, F>;
export function parser<A, B, C, D, E, F, G>(a: Parser<A, B>, b: Step<A, B, C>, c: Step<A, C, D>, d: Step<A, D, E>, e: Step<A, E, F>, f: Step<A, F, G>): Parser<A, G>;
export function parser<A>(a: Parser<A, any>, ...chain: Step<A, any, any>[]): Parser<A, any> ;
export function parser<A>(a: Parser<A, any>, ...chain: Step<A, any, any>[]): Parser<A, any> {
    return chain.reduce((a, b) => {
        if (b instanceof Transducer) return TransducingParser.create(a, b);
        return b(a);
    }, a);
}
