import {describe, it} from "bun:test";
import {parseHTML} from "linkedom";
import {Display} from "../../src/api/display.ts";
import {Throttle} from "../../src/Throttle.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {assertFalse, assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {chain} from "@bodar/yadic/chain.ts";

describe("Renderer", () => {
    async function render(fun: (doc: Document, display: (v: any) => any) => any, initialSlot: string = ''): Promise<Element> {
        const globals = parseHTML(`<body><slot name="output">${initialSlot}</slot></body>`);
        const throttle = Throttle.auto();
        const display = Display.for('output', chain({throttle, reactiveRoot: globals.document.documentElement}, globals));

        // Execute the function which should call display() to render values
        fun(globals.document, display);

        // Wait for throttle to flush
        await throttle();
        return globals.document.querySelector('slot[name="output"]')!;
    }

    it("Can render a string", async () => {
        assertThat((await render((_, display) => display('Hello, world!'))).innerHTML, is('Hello, world!'));
    });

    it("Can render a number", async () => {
        assertThat((await render((_, display) => display(123))).innerHTML, is('123'));
    });

    it("Can render a element", async () => {
        assertThat((await render((document, display) => display(document.createElement('div')))).innerHTML, is('<div></div>'));
    });

    it("Can render an array of nodes", async () => {
        assertThat((await render((document, display) => display([
            document.createElement('div'),
            document.createTextNode('Hello, world!'),
            document.createElement('span')
        ]))).innerHTML, is('<div></div>Hello, world!<span></span>'));
    });

    const tag = Symbol('tag');
    const tagValue = 'new';

    function tagAsNew<T>(value: T): T {
        if (Array.isArray(value)) {
            for (const element of value) {
                Reflect.set(element, tag, tagValue);
            }
        } else {
            Reflect.set(value as object, tag, tagValue);
        }
        return value;
    }

    function isNew(instance: any): boolean {
        return Reflect.get(instance, tag) === tagValue;
    }

    it("Only updates nodes if they are different", async () => {
        const [child] = Array.from((await render((document, display) =>
            display(tagAsNew(document.createElement('div'))), '<div></div>')).childNodes);
        assertFalse(isNew(child));
    });

    it("Also does the diff when there are multiple nodes", async () => {
        const updated = (await render((document, display) => display(tagAsNew([
                document.createElement('div'),
                document.createTextNode('different'),
                document.createElement('span')
            ])),
            '<div></div>Will-be-replaced<span></span>'));
        assertThat(updated.innerHTML, equals('<div></div>different<span></span>'));
        assertThat(Array.from(updated.childNodes).map(isNew), equals([false, true, false]));
    });

    it("Supports diffing even if the lengths don't match", async () => {
        const updated = (await render((document, display) => display(tagAsNew([
                document.createElement('div'),
                document.createTextNode('different'),
                document.createElement('span'),
                document.createElement('img')
            ])),
            '<div></div>Will-be-replaced'));
        assertThat(updated.innerHTML, equals('<div></div>different<span></span><img>'));
        assertThat(Array.from(updated.childNodes).map(isNew), equals([false, true, true, true]));
    });

    it("Will remove excess nodes", async () => {
        const updated = (await render((document, display) => display(tagAsNew([
                document.createTextNode('different'),
            ])),
            '<div></div>Will-be-replaced<div></div>'));

        assertThat(updated.innerHTML, equals('different'));
        assertThat(Array.from(updated.childNodes).map(isNew), equals([true]));
    });
});