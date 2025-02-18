import {describe, it} from "bun:test";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {assertThat, assertTrue, assertFalse} from "@bodar/totallylazy/asserts/assertThat";
import {equal} from "@bodar/totallylazy/functions/equal";

describe("EqualsPredicate", () => {
    it("is inspectable", () => {
        assertThat(equals(2).value, is(2));
    });

    it("is self describing", () => {
        assertThat(equals(2).toString(), is('equals(2)'));
    });
});

describe("equal", () => {
    it("uses Object.is for primitives", () => {
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

        assertTrue(equal(NaN,NaN));
        assertTrue(equal(Infinity,Infinity));
        assertTrue(equal(-Infinity,-Infinity));
    });

    it("implements Same-value-zero", () => {
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
    });
});