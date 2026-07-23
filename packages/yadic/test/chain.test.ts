import {describe, expect, test} from "bun:test";
import {chain} from "@bodar/yadic/chain.ts";

describe("chain", () => {
    test("can chain objects together", () => {
        const result = chain({a: 1}, {b: 2}, {c: 3});
        expect(result.a).toEqual(1);
        expect(result.b).toEqual(2);
        expect(result.c).toEqual(3);
    });

    test("earlier objects take precedence", () => {
        const result = chain({a: 1}, {a: 2});
        expect(result.a).toEqual(1);
    });

    test("earlier objects take precedence and type is correct", () => {
        const result: {a: number} = chain({a: 1}, {a: 'two'});
        expect(result.a).toEqual(1);
    });

    // Writes follow prototype-chain semantics: they shadow on the first object,
    // never mutating the later (shared) objects — delete included.
    test("writes apply to the first object", () => {
        const first: {a: number, b?: number} = {a: 1};
        const second = {a: 2, b: 2};
        const result = chain(first, second);

        result.b = 3;

        expect(result.b).toEqual(3);
        expect(first.b).toEqual(3);
        expect(second.b).toEqual(2);
    });

    test("defineProperty and delete apply to the first object", () => {
        const first: {a?: number} = {};
        const second = {a: 2};
        const result = chain(first, second);

        Object.defineProperty(result, 'a', {value: 1, configurable: true, enumerable: true});
        expect(first.a).toEqual(1);
        expect(result.a).toEqual(1);

        Reflect.deleteProperty(result, 'a');
        expect(first.a).toBeUndefined();
        expect(result.a).toEqual(2);   // falls through to the second object again
        expect(second.a).toEqual(2);
    });
});
