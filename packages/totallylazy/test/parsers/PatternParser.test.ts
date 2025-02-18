import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {view} from "@bodar/totallylazy/parsers/View";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {pattern} from "@bodar/totallylazy/parsers/PatternParser";

describe("PatternParser", () => {
    it("can parse using a pattern", () => {
        const result = pattern(/A+/).parse(view('AAABBBCCC'));
        assertThat(result.value, is('AAA'));
        assertThat(result.remainder.toSource(), is('BBBCCC'));
    });
});
