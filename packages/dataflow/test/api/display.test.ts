import {describe, expect, test} from "bun:test";
import {display, Display} from "../../src/api/display.ts";
import {parseHTML} from "linkedom";
import {chain} from "@bodar/yadic/chain.ts";
import {Throttle} from "../../src/Throttle.ts";

describe("display", () => {
    test("placeholder throws an error when called directly", () => {
        expect(() => display('Hello')).toThrow('display() is a placeholder');
    });
})

describe("Display", () => {


    test("display connects to the DOM and flushes when Throttle settles", async () => {
        const browser = parseHTML('<slot name="key"></slot>');
        const throttle = Throttle.auto();
        const display = Display.for('key', chain({throttle}, browser))

        expect(display('Hello')).toEqual('Hello');
        expect(display('Dan')).toEqual('Dan');

        expect(display.key).toEqual('key');
        expect(display.values).toEqual(['Hello', 'Dan']);

        const slot = browser.document.querySelector<HTMLSlotElement>(`slot[name=key]`)!;
        expect(slot.innerHTML).toEqual('');
        await throttle();
        expect(slot.innerHTML).toEqual('HelloDan');
    });

    test("different display instances share the same state", async () => {
        // const display1 = Display.for('key')
        // const hello = display1('Hello');
        // expect(hello).toEqual('Hello');
        //
        // const display2 = Display.for('key')
        // display2('Dan');
        // expect(display2.values).toEqual(['Hello', 'Dan']);
    });
})