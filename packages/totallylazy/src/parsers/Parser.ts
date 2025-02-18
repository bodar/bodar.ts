import {result} from "./Result.ts";
import type {Result} from "./Result.ts";
import type {View} from "./View.ts";
import {Transducer} from "../transducers/Transducer.ts";
import {flatten} from "../transducers/CompositeTransducer.ts";

export interface Parser<A, B> {
    parse(input: View<A>): Result<A, B>;
}

export class TransducingParser<A, B> implements Parser<A, B> {
    private constructor(private readonly parser: Parser<any, any>,
                        private readonly transducers: readonly Transducer<any, any>[]) {
    }

    static create<A, B>(parser: Parser<any, any>, ...transducers: readonly Transducer<any, any>[]): TransducingParser<A, B> {
        if (parser instanceof TransducingParser) return TransducingParser.create(parser.parser, ...[...parser.transducers, ...transducers]);
        return new TransducingParser(parser, flatten(transducers));
    }

    parse(input: View<A>): Result<A, B> {
        return result(this.parser.parse(input), ...this.transducers);
    }
}


export type Transformer<A, B, C> = (a: Parser<A, B>) => Parser<A, C>;
export type Step<A, B, C> = Transformer<A, B, C> | Transducer<B, C>;

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
