import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {many} from "@bodar/totallylazy/parsers/ManyParser";
import {string} from "@bodar/totallylazy/parsers/StringParser";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {view} from "@bodar/totallylazy/parsers/View";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";

describe("ManyParser", () => {
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
