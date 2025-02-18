import {describe, it} from "bun:test";
import {view} from "@bodar/totallylazy/parsers/View";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {C, Comment} from "@bodar/totallylazy/grammars/C";

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