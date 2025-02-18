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
import {between, precededBy, then} from "@bodar/totallylazy/parsers/parsers";

describe("Parser", () => {
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