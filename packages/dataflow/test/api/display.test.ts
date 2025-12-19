import {describe, expect, test, beforeEach} from "bun:test";
import {display, Display} from "../../src/api/display.ts";

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

describe("Display", () => {
    beforeEach(() => {
        Display.for('key').clear();
    });

    test("display is stateful", async () => {
        const display = Display.for('key')

        const hello = display('Hello');
        expect(hello).toEqual('Hello');

        expect(display.key).toEqual('key');
        expect(display.values).toEqual(['Hello']);

        expect(display.pop()).toEqual(['Hello']);
        expect(display.values).toEqual([]);
    });

    test("different display instances share the same state", async () => {
        const display1 = Display.for('key')
        const hello = display1('Hello');
        expect(hello).toEqual('Hello');

        const display2 = Display.for('key')
        display2('Dan');
        expect(display2.values).toEqual(['Hello', 'Dan']);
    });
})