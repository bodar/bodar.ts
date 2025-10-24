import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {view} from "@bodar/totallylazy/parsers/View.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {string} from "@bodar/totallylazy/parsers/StringParser.ts";
import {pair, triple, list, tuple} from "@bodar/totallylazy/parsers/ListParser.ts";
import {regex} from "@bodar/totallylazy/parsers/RegexParser.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {parser} from "@bodar/totallylazy/parsers/Parser.ts";
import type {Result} from "@bodar/totallylazy/parsers/Result.ts";

describe("ListParser", () => {
    it("compose parsers into a list", () => {
        const integer = parser(regex(/\d+/), map(Number));
        const result: Result<string, (number|string)[]> = list(integer, string('AAA'), string('BBB'))
            .parse(view('123AAABBBCCC'));
        assertThat(result.value, equals([123, 'AAA', 'BBB']));
        assertThat(result.remainder.toSource(), is('CCC'));
    });

    it("compose parsers into pairs", () => {
        const result: Result<string, [string, string]> = pair(string('AAA'), string('BBB')).parse(view('AAABBBCCC'));
        assertThat(result.value, equals(['AAA', 'BBB']));
        assertThat(result.remainder.toSource(), is('CCC'));
    });

    it("compose parsers into triples", () => {
        const integer = parser(regex(/\d+/), map(Number));
        const result: Result<string, [number, string, string]> = triple(integer, string('AAA'), string('BBB'))
            .parse(view('123AAABBBCCC'));
        assertThat(result.value, equals([123, 'AAA', 'BBB']));
        assertThat(result.remainder.toSource(), is('CCC'));
    });

    it("compose parsers into tuples", () => {
        const integer = parser(regex(/\d+/), map(Number));
        const result: Result<string, [number, string, string, number]> = tuple(integer, string('AAA'), string('BBB'), integer)
            .parse(view('123AAABBB456CCC'));
        assertThat(result.value, equals([123, 'AAA', 'BBB', 456]));
        assertThat(result.remainder.toSource(), is('CCC'));
    });
});
