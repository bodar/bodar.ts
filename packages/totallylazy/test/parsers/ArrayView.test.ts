import {describe, it} from "bun:test";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {ArrayView, view} from "@bodar/totallylazy/parsers/View.ts";


describe("ArrayView", () => {
    it("isEmpty", () => {
        assertThat(view([]).isEmpty(), is(true));
        assertThat(view(['a']).isEmpty(), is(false));
        assertThat(view(['a', 'b']).slice(1).isEmpty(), is(false));
        assertThat(view(['a', 'b']).slice(2).isEmpty(), is(true));
    });

    it("at", () => {
        assertThat(view([]).at(0), is(undefined));
        assertThat(view(['a']).at(0), is('a'));
        assertThat(view(['a', 'b']).at(1), is('b'));
    });

    it("at does not go past the limit or end", () => {
        const view = new ArrayView(['a', 'b', 'c']).slice(0, 1);
        assertThat(view.toSource(), equals(['a']));
        assertThat(view.at(1), is(undefined));
    });

    it("slice", () => {
        assertThat(view(['a', 'b']).slice(1).at(0), is('b'));
        assertThat(view(['a', 'b']).slice(2).at(0), is(undefined));
    });

    it("slice supports end", () => {
        assertThat(view(['a', 'b', 'c']).slice(1, 2).toSource(), equals(['b']));
        assertThat(view(['a', 'b', 'c', 'd']).slice(1, 2).toSource(), equals(['b']));
        assertThat(view(['a', 'b', 'c', 'd', 'e']).slice(1, 3).toSource(), equals(['b', 'c']));
    });

    it("toArray", () => {
        assertThat(view(['a', 'b']).toSource(), equals(['a', 'b']));
        assertThat(view(['a', 'b']).slice(1).toSource(), equals(['b']));
    });

    it("does not copy array values but instead calculates position into array", () => {
        const view = new ArrayView(['a', 'b', 'c']);
        assertThat(view.values, equals(['a', 'b', 'c']));
        assertThat(view.offset, is(0));
        assertThat(view.length, is(3));
        const sub1 = view.slice(1);
        assertThat(sub1.values, equals(['a', 'b', 'c']));
        assertThat(sub1.offset, is(1));
        assertThat(sub1.length, is(2));
        const sub2 = sub1.slice(1);
        assertThat(sub2.values, equals(['a', 'b', 'c']));
        assertThat(sub2.offset, is(2));
        assertThat(sub2.length, is(1));

        const sub3 = view.slice(1, 2);
        assertThat(sub3.values, equals(['a', 'b', 'c']));
        assertThat(sub3.offset, is(1));
        assertThat(sub3.length, is(1));
    });

    it("can create from a string", () => {
        const instance = view('HELLO');
        assertThat(instance.isEmpty(), is(false));
        assertThat(instance.at(0), is('H'));
        assertThat(instance.slice(2).toSource(), is('LLO'));
    });

    it("can create from a typed array", () => {
        const hello: Uint8Array = new TextEncoder().encode('HELLO');
        const instance = view(hello);
        assertThat(instance.isEmpty(), is(false));
        assertThat(instance.at(0), is(72));
        assertThat(instance.slice(2).toSource(), equals(hello.subarray(2)));
    });

});
