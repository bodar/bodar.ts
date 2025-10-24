import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {view} from "@bodar/totallylazy/parsers/View.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {regex} from "@bodar/totallylazy/parsers/RegexParser.ts";

describe("RegexParser", () => {
    it("can parse using a regex", () => {
        const result = regex(/A+/).parse(view('AAABBBCCC'));
        assertThat(result.value, is('AAA'));
        assertThat(result.remainder.toSource(), is('BBBCCC'));
    });
});
