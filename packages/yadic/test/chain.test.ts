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
});
