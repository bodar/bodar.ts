import {describe, it} from "bun:test";
import {view} from "@bodar/totallylazy/parsers/View.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {C, Comment} from "@bodar/totallylazy/grammars/C.ts";

describe("C", () => {
    it("can capture a comment", () => {
        assertThat(C.comment.parse(view('// This is a single line comment\n')).value,
            equals(new Comment('This is a single line comment')));
        assertThat(C.comment.parse(view('// This is a single line comment')).value,
            equals(new Comment('This is a single line comment')));
        assertThat(C.comment.parse(view('/* This is a multi line comment */')).value,
            equals(new Comment('This is a multi line comment')));
    });
});