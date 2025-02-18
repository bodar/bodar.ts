import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {escapeIdentifier, escapeLiteral} from "@bodar/lazyrecords/sql/ansi/escape";

describe('escapeIdentifier', () => {
    it('wraps in double quotes and escapes existing quotes', () => {
        assertThat(escapeIdentifier('column'), is(`"column"`));
        assertThat(escapeIdentifier('Hello " Dan'), is(`"Hello "" Dan"`));
    });
});

describe('escapeLiteral', () => {
    it('wraps in single quotes and escapes existing quotes', () => {
        assertThat(escapeLiteral('Dan'), is(`'Dan'`));
        assertThat(escapeLiteral(`Dan's cat`), is(`'Dan''s cat'`));
    });
});