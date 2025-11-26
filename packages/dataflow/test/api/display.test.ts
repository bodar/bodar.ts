import {describe, expect, test, beforeEach} from "bun:test";
import {display} from "../../src/api/display.ts";

describe("display", () => {
    beforeEach(() => {
        display.clear();
    });

    test("stores the value for later retrieval", async () => {
        const hello = display('Hello');
        expect(hello).toEqual('Hello');
        expect(display.values).toEqual(['Hello']);
    });

    test("popping will get the values and then clear", async () => {
        display('Hello');

        expect(display.pop()).toEqual(['Hello']);
        expect(display.values).toEqual([]);
    });
})