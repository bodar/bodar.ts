import {describe, it} from "bun:test";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {alphaNumeric, digit, hexDigit, letter, whitespace} from "@bodar/totallylazy/predicates/characters";

describe("characters", () => {

    describe("digit", () => {
        it("matches digits 0-9", () => {
            assertThat(digit('0'), is(true));
            assertThat(digit('5'), is(true));
            assertThat(digit('9'), is(true));
        });

        it("does not match non-digits", () => {
            assertThat(digit('a'), is(false));
            assertThat(digit('A'), is(false));
            assertThat(digit(' '), is(false));
            assertThat(digit('-'), is(false));
        });
    });

    describe("letter", () => {
        it("matches lowercase letters", () => {
            assertThat(letter('a'), is(true));
            assertThat(letter('m'), is(true));
            assertThat(letter('z'), is(true));
        });

        it("matches uppercase letters", () => {
            assertThat(letter('A'), is(true));
            assertThat(letter('M'), is(true));
            assertThat(letter('Z'), is(true));
        });

        it("does not match non-letters", () => {
            assertThat(letter('0'), is(false));
            assertThat(letter('9'), is(false));
            assertThat(letter(' '), is(false));
            assertThat(letter('_'), is(false));
        });
    });

    describe("alphaNumeric", () => {
        it("matches letters and digits", () => {
            assertThat(alphaNumeric('a'), is(true));
            assertThat(alphaNumeric('Z'), is(true));
            assertThat(alphaNumeric('0'), is(true));
            assertThat(alphaNumeric('9'), is(true));
        });

        it("does not match other characters", () => {
            assertThat(alphaNumeric(' '), is(false));
            assertThat(alphaNumeric('_'), is(false));
            assertThat(alphaNumeric('-'), is(false));
            assertThat(alphaNumeric('.'), is(false));
        });
    });

    describe("hexDigit", () => {
        it("matches decimal digits", () => {
            assertThat(hexDigit('0'), is(true));
            assertThat(hexDigit('5'), is(true));
            assertThat(hexDigit('9'), is(true));
        });

        it("matches lowercase hex letters", () => {
            assertThat(hexDigit('a'), is(true));
            assertThat(hexDigit('c'), is(true));
            assertThat(hexDigit('f'), is(true));
        });

        it("matches uppercase hex letters", () => {
            assertThat(hexDigit('A'), is(true));
            assertThat(hexDigit('C'), is(true));
            assertThat(hexDigit('F'), is(true));
        });

        it("does not match non-hex characters", () => {
            assertThat(hexDigit('g'), is(false));
            assertThat(hexDigit('G'), is(false));
            assertThat(hexDigit('z'), is(false));
            assertThat(hexDigit('Z'), is(false));
            assertThat(hexDigit(' '), is(false));
        });
    });

    describe("whitespace", () => {
        it("matches space", () => {
            assertThat(whitespace(' '), is(true));
        });

        it("matches tab", () => {
            assertThat(whitespace('\t'), is(true));
        });

        it("matches newline", () => {
            assertThat(whitespace('\n'), is(true));
        });

        it("matches carriage return", () => {
            assertThat(whitespace('\r'), is(true));
        });

        it("matches form feed", () => {
            assertThat(whitespace('\f'), is(true));
        });

        it("matches vertical tab", () => {
            assertThat(whitespace('\v'), is(true));
        });

        it("does not match non-whitespace characters", () => {
            assertThat(whitespace('a'), is(false));
            assertThat(whitespace('0'), is(false));
            assertThat(whitespace('_'), is(false));
        });
    });
});