import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {view} from "@bodar/totallylazy/parsers/View.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {flatMap} from "@bodar/totallylazy/transducers/FlatMapTransducer.ts";
import {string} from "@bodar/totallylazy/parsers/StringParser.ts";
import {parser} from "@bodar/totallylazy/parsers/Parser.ts";
import {regex} from "@bodar/totallylazy/parsers/RegexParser.ts";
import {atLeast, atMost, between, many, many1, precededBy, then, times} from "@bodar/totallylazy/parsers/parsers.ts";
import {matches} from "@bodar/totallylazy/parsers/PredicatesParser.ts";
import {digit} from "@bodar/totallylazy/predicates/characters.ts";
import {Failure} from "@bodar/totallylazy/parsers/Failure.ts";

describe("parsers", () => {
    it("can map", () => {
        const r = parser(regex(/\d+/), map(Number)).parse(view('123 USD'));
        assertThat(r.value, is(123));
        assertThat(r.remainder.toSource(), is(' USD'));
    });

    it("can flatMap", () => {
        const input = view('123 USD');
        const anotherParser = string('1');
        const r = parser(regex(/\d+/), flatMap(n => anotherParser.parse(view(n)))).parse(input);
        assertThat(r.value, is('1'));
        assertThat(r.remainder.toSource(), is(' USD'));
    });

    it("can compose with 'then'", () => {
        const input = view('123 USD');
        const r = parser(regex(/\d+/), map(Number), then(
            parser(string('USD'), precededBy(string(' '))))).parse(input);
        assertThat(r.value, equals([123, 'USD']));
        assertThat(r.remainder.toSource(), is(''));
    });

    it("can compose with 'between'", () => {
        const input = view('(123)');
        const r = parser(regex(/\d+/), map(Number), between(string('('), string(')'))).parse(input);
        assertThat(r.value, is(123));
        assertThat(r.remainder.toSource(), is(''));
    });
});

describe("many", () => {
    it("can parse many", () => {
        const result = many(string('A')).parse(view('AAABBBCCC'));
        assertThat(result.value, equals(['A', 'A', 'A']));
        assertThat(result.remainder.toSource(), is('BBBCCC'));
    });

    it("still works if it consumes all values", () => {
        const result = many(string('A')).parse(view('AAA'));
        assertThat(result.value, equals(['A', 'A', 'A']));
        assertThat(result.remainder.toSource(), is(''));
    });
});

describe("many1", () => {
    it("parses one or more repetitions", () => {
        const digits = parser(matches(digit), many1());
        const result = digits.parse(view('123abc'));
        assertThat(result.value, equals(['1', '2', '3']));
        assertThat(result.remainder.toSource(), is('abc'));
    });

    it("fails if zero repetitions", () => {
        const digits = parser(matches(digit), many1());
        const result = digits.parse(view('abc'));
        assertThat(result instanceof Failure, is(true));
    });
});

describe("atLeast", () => {
    it("parses at least N repetitions", () => {
        const atLeastThree = parser(matches(digit), atLeast(3));
        const result = atLeastThree.parse(view('12345abc'));
        assertThat(result.value, equals(['1', '2', '3', '4', '5']));
        assertThat(result.remainder.toSource(), is('abc'));
    });

    it("fails if fewer than N repetitions", () => {
        const atLeastThree = parser(matches(digit), atLeast(3));
        const result = atLeastThree.parse(view('12abc'));
        assertThat(result instanceof Failure, is(true));
    });
});

describe("atMost", () => {
    it("parses at most N repetitions", () => {
        const atMostThree = parser(matches(digit), atMost(3));
        const result = atMostThree.parse(view('12345'));
        assertThat(result.value, equals(['1', '2', '3']));
        assertThat(result.remainder.toSource(), is('45'));
    });

    it("succeeds with zero repetitions", () => {
        const atMostThree = parser(matches(digit), atMost(3));
        const result = atMostThree.parse(view('abc'));
        assertThat(result.value, equals([]));
        assertThat(result.remainder.toSource(), is('abc'));
    });
});


describe("times", () => {
    it("parses exactly N repetitions", () => {
        const fourDigits = parser(matches(digit), times(4));
        const result = fourDigits.parse(view('123456'));
        assertThat(result.value, equals(['1', '2', '3', '4']));
        assertThat(result.remainder.toSource(), is('56'));
    });

    it("fails if not enough elements", () => {
        const fourDigits = parser(matches(digit), times(4));
        const result = fourDigits.parse(view('123'));
        assertThat(result instanceof Failure, is(true));
    });
});