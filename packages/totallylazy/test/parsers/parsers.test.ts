import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {view} from "@bodar/totallylazy/parsers/View";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {map} from "@bodar/totallylazy/transducers/MapTransducer";
import {flatMap} from "@bodar/totallylazy/transducers/FlatMapTransducer";
import {string} from "@bodar/totallylazy/parsers/StringParser";
import {parser} from "@bodar/totallylazy/parsers/Parser";
import {pattern} from "@bodar/totallylazy/parsers/PatternParser";
import {between, precededBy, then, times} from "@bodar/totallylazy/parsers/parsers";
import {matches} from "@bodar/totallylazy/parsers/PredicatesParser.ts";
import {digit} from "@bodar/totallylazy/predicates/characters.ts";
import {Failure} from "@bodar/totallylazy/parsers/Failure.ts";

describe("parsers", () => {
    it("can map", () => {
        const r = parser(pattern(/\d+/), map(Number)).parse(view('123 USD'));
        assertThat(r.value, is(123));
        assertThat(r.remainder.toSource(), is(' USD'));
    });

    it("can flatMap", () => {
        const input = view('123 USD');
        const anotherParser = string('1');
        const r = parser(pattern(/\d+/), flatMap(n => anotherParser.parse(view(n)))).parse(input);
        assertThat(r.value, is('1'));
        assertThat(r.remainder.toSource(), is(' USD'));
    });

    it("can compose with 'then'", () => {
        const input = view('123 USD');
        const r = parser(pattern(/\d+/), map(Number), then(
            parser(string('USD'), precededBy(string(' '))))).parse(input);
        assertThat(r.value, equals([123, 'USD']));
        assertThat(r.remainder.toSource(), is(''));
    });

    it("can compose with 'between'", () => {
        const input = view('(123)');
        const r = parser(pattern(/\d+/), map(Number), between(string('('), string(')'))).parse(input);
        assertThat(r.value, is(123));
        assertThat(r.remainder.toSource(), is(''));
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