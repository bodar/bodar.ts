import {describe, it} from "bun:test";
import { assertThat } from "@bodar/totallylazy/asserts/assertThat.ts";
import {fromArray, fromString} from "@bodar/totallylazy/collections/ArraySegment.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {empty} from "@bodar/totallylazy/collections/Segment.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

describe("ArraySegment", async () => {
    it("supports is empty", function() {
        assertThat(fromArray([]).empty, is(true));
        assertThat(fromArray([1]).empty, is(false));
        assertThat(fromArray([1]).tail.empty, is(true));
    });

    it("can create from an array", function() {
        const s = fromArray([1, 2, 3]);
        assertThat(s.head, is(1));
        assertThat(s.tail.head, is(2));
        assertThat(s.tail.tail.head, is(3));
        assertThat(s.tail.tail.tail, is(empty));
    });

    it("can create from a TypeArray", function() {
        const hello: Uint8Array = new TextEncoder().encode('HELLO');
        const s = fromArray(hello);
        assertThat(s.head, is(72));
        assertThat(s.tail.head, is(69));
        assertThat(s.tail.tail.head, is(76));
        assertThat(s.tail.tail.tail.head, is(76));
        assertThat(s.tail.tail.tail.tail.head, is(79));
        assertThat(s.tail.tail.tail.tail.tail, is(empty));
    });

    it("toArray returns the original array if available", function() {
        const original = [1, 2, 3];
        const arraySegment = fromArray(original);
        assertThat(arraySegment.toArray(), is(original));
        assertThat(arraySegment.tail.toArray(), equals(original.slice(1)));
        assertThat(arraySegment.tail.tail.toArray(), equals(original.slice(2)));

        const hello: Uint8Array = new TextEncoder().encode('HELLO');
        const helloSegment = fromArray(hello);
        assertThat(helloSegment.toArray(), is(hello));
        assertThat(helloSegment.tail.toArray(), equals(hello.subarray(1)));
        assertThat(helloSegment.tail.tail.toArray(), equals(hello.subarray(2)));
    });

    it("can create from a string", function() {
        const s = fromString("HELLO");
        assertThat(s.head, is('H'));
        assertThat(s.tail.head, is('E'));
        assertThat(s.tail.tail.head, is('L'));
        assertThat(s.tail.tail.tail.head, is('L'));
        assertThat(s.tail.tail.tail.tail.head, is('O'));
        assertThat(s.tail.tail.tail.tail.tail, is(empty));
    });

    it("is iterable", function() {
        const s = fromString("HELLO");
        assertThat(Array.from(s), equals(['H', 'E', 'L', 'L', 'O']));
    });
});