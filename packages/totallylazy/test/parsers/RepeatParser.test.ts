import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {view} from "@bodar/totallylazy/parsers/View";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {parser} from "@bodar/totallylazy/parsers/Parser";
import {repeat} from "@bodar/totallylazy/parsers/RepeatParser";
import {matches} from "@bodar/totallylazy/parsers/PredicatesParser";
import {digit} from "@bodar/totallylazy/predicates/characters";
import {Failure} from "@bodar/totallylazy/parsers/Failure";

describe("RepeatParser", () => {
    describe("repeat", () => {
        it("parses exactly N repetitions", () => {
            const fourDigits = parser(matches(digit), repeat(4, 4));
            const result = fourDigits.parse(view('123456'));
            assertThat(result.value, equals(['1', '2', '3', '4']));
            assertThat(result.remainder.toSource(), is('56'));
        });

        it("parses between min and max repetitions", () => {
            const twoToFourDigits = parser(matches(digit), repeat(2, 4));
            const result = twoToFourDigits.parse(view('123'));
            assertThat(result.value, equals(['1', '2', '3']));
            assertThat(result.remainder.toSource(), is(''));
        });

        it("fails if fewer than min repetitions", () => {
            const twoToFourDigits = parser(matches(digit), repeat(2, 4));
            const result = twoToFourDigits.parse(view('1abc'));
            assertThat(result instanceof Failure, is(true));
        });

        it("succeeds with min repetitions", () => {
            const twoToFourDigits = parser(matches(digit), repeat(2, 4));
            const result = twoToFourDigits.parse(view('12abc'));
            assertThat(result.value, equals(['1', '2']));
            assertThat(result.remainder.toSource(), is('abc'));
        });
    });
});