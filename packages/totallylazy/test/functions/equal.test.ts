import {describe, it} from "bun:test";
import {assertFalse, assertTrue} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equal} from "@bodar/totallylazy/functions/equal.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("equal", () => {
    it("handles primitives", () => {
        assertTrue(equal(undefined, undefined));
        assertFalse(equal(undefined,null));
        assertFalse(equal(undefined,0));

        assertTrue(equal(null,null));
        assertFalse(equal(null,'null'));
        assertFalse(equal(null,0));

        assertTrue(equal(true,true));
        assertFalse(equal(true,false));
        assertFalse(equal(true,'true'));
        assertFalse(equal(true,1));

        assertTrue(equal(Infinity,Infinity));
        assertTrue(equal(-Infinity,-Infinity));
    });

    it("implements Same-value-zero", () => {
        assertTrue(equal(NaN,NaN));
        assertTrue(equal(NaN,-NaN));
        assertTrue(equal(+0,-0));
        assertTrue(equal(+0,0));
        assertTrue(equal(-0,0));
        assertTrue(equal(0n,-0n));
    });

    it("supports Dates", () => {
        assertTrue(equal(new Date('2000-01-02'), new Date('2000-01-02')));
        assertFalse(equal(new Date('2000-01-02'), new Date('2000-01-03')));
    });

    it("supports Regex", () => {
        assertTrue(equal(/1/g, /1/g));
        assertFalse(equal(/1/g, /2/g));
        assertFalse(equal(/1/g, /1/gm));
    });

    it("supports Objects", () => {
        assertTrue(equal({foo: 1, bar: "2", baz: new Date('2000-01-02') },{foo: 1, bar: "2", baz: new Date('2000-01-02') }));
        assertFalse(equal({foo: "diff", bar: "2", baz: new Date('2000-01-02') },{foo: 1, bar: "2", baz: new Date('2000-01-02') }));

        class Car {
        }

        assertTrue(equal(new Car(), new Car()));
        assertFalse(equal(new Car(), {}));
    });

    it("supports Arrays", () => {
        assertTrue(equal([], []));
        assertFalse(equal([], [1]));
        assertTrue(equal([1], [1]));
        assertFalse(equal([1], ['1']));
    });

    it("supports Maps", () => {
        assertTrue(equal(new Map(), new Map()));
        assertFalse(equal(new Map(), new Map([['a', 1]])));
        assertTrue(equal(new Map([['a', 1]]), new Map([['a', 1]])));
        assertFalse(equal(new Map([['a', 1]]), new Map([['b', 1]])));
        assertFalse(equal(new Map([['a', 1]]), new Map([['a', '1']])));
    });

    it("supports Sets", () => {
        assertTrue(equal(new Set(), new Set()));
        assertFalse(equal(new Set(), new Set(['a'])));
        assertTrue(equal(new Set(['a']), new Set(['a'])));
        assertFalse(equal(new Set([1]), new Set(['1'])));
    });

    it("does deep equality", () => {
        assertTrue(equal({foo: 1, bar: { baz: 2} },{foo: 1, bar: { baz: 2} }));
        assertTrue(equal({foo: 1, bar: new Set([{ baz: 2}]) }, {foo: 1, bar: new Set([{ baz: 2}]) }));
        // deno assert/equal is broken for sets with nested objects
        assertFalse(equal({foo: 1, bar: new Set([{ baz: 2}]) }, {foo: 1, bar: new Set([{ baz: 3}]) }));
        assertFalse(equal({foo: 'different', bar: new Set([{ baz: 'different'}]) }, {foo: 1, bar: new Set([{ baz: 2}]) }));
    });

    it("supports Function equality", () => {
        assertTrue(equal(is(42),is(42)));
        assertFalse(equal(is(42),is(43)));
        assertFalse(equal(is(42),is('42')));

        assertTrue(equal((x: number) => x % 2 === 0, (x: number) => x % 2 === 0));
        // If 2 identical arrow functions are considered equal, then 2 identical anonymous functions should be too
        // even though their prototypes are different
        assertTrue(equal(function (){}, function (){}));
        assertFalse(equal(function (_a:unknown){},function (_a:unknown, _b:unknown){}));
        assertFalse(equal(function a(_a:unknown){}, function b(_a:unknown){}));
    });
});