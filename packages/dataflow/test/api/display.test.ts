import {describe, expect, test} from "bun:test";
import {display, Display} from "../../src/api/display.ts";
import {parseHTML} from "linkedom";
import {chain} from "@bodar/yadic/chain.ts";

describe("display", () => {
    test("placeholder throws an error when called directly", () => {
        expect(() => display('Hello')).toThrow('display() is a placeholder');
    });
})

describe("Display", () => {
    test("display connects to the DOM and flushes the values it collected", async () => {
        const browser = parseHTML('<body><slot name="key"></slot></body>');
        const display = Display.for('key', chain({reactiveRoot: browser.document.documentElement}, browser))

        expect(display('Hello')).toEqual('Hello');
        expect(display('Dan')).toEqual('Dan');

        expect(display.key).toEqual('key');
        expect(display.values).toEqual(['Hello', 'Dan']);

        const slot = browser.document.querySelector<HTMLSlotElement>(`slot[name=key]`)!;
        expect(slot.innerHTML).toEqual('');
        await Promise.resolve();
        expect(slot.innerHTML).toEqual('HelloDan');
    });

    test("flushes on a microtask, so it lands with effects from the same run rather than a frame later", async () => {
        const browser = parseHTML('<body><slot name="key"></slot></body>');
        const display = Display.for('key', chain({reactiveRoot: browser.document.documentElement}, browser))

        display('Hello');
        display('Dan');
        const slot = browser.document.querySelector<HTMLSlotElement>(`slot[name=key]`)!;
        expect(slot.innerHTML).toEqual('');
        await Promise.resolve();
        expect(slot.innerHTML).toEqual('HelloDan');
    });

    test("ignores a slot with the same key inside a nested island", async () => {
        const browser = parseHTML('<html><body><div is="reactive-island"><slot name="key"></slot></div><p><slot name="key"></slot></p></body></html>');
        const display = Display.for('key', chain({reactiveRoot: browser.document.body}, browser))

        display('Hello');
        await Promise.resolve();
        expect(browser.document.querySelector('div slot')!.innerHTML).toEqual('');
        expect(browser.document.querySelector('p slot')!.innerHTML).toEqual('Hello');
    });
})