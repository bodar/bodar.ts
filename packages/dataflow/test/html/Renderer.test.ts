import {describe, it} from "bun:test";
import {parseHTML} from "linkedom";
import {Renderer} from "../../src/html/Renderer.ts";
import {BaseGraph} from "../../src/BaseGraph.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {assertFalse, assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

describe("Renderer", () => {
    async function render(fun: (doc: Document) => any, initalStart: string = ''): Promise<Element> {
        const globals = parseHTML(`<slot name="output">${initalStart}</slot>`);
        Reflect.set(globals, 'graph', new BaseGraph());
        const renderer = new Renderer(globals as any);

        renderer.register('output', [], [], () => fun(globals.document));
        renderer.render();

        await new Promise(resolve => setTimeout(resolve, 0));
        return globals.document.querySelector('slot[name="output"]')!;
    }

    it("Can render a string", async () => {
        assertThat((await render(() => 'Hello, world!')).innerHTML, is('Hello, world!'));
    });

    it("Can render a number", async () => {
        assertThat((await render(() => 123)).innerHTML, is('123'));
    });

    it("Can render a element", async () => {
        assertThat((await render(document => document.createElement('div'))).innerHTML, is('<div></div>'));
    });

    it("Can render an array of nodes", async () => {
        assertThat((await render(document => [
            document.createElement('div'),
            document.createTextNode('Hello, world!'),
            document.createElement('span')
        ])).innerHTML, is('<div></div>Hello, world!<span></span>'));
    });

    const tag = Symbol('tag');
    const tagValue = 'new';

    function tagAsNew(fun: (document: Document) => any) {
        return (doc: Document) => {
            const result = fun(doc);
            if (Array.isArray(result)) {
                for (const resultElement of result) {
                    Reflect.set(resultElement, tag, tagValue);
                }
            } else {
                Reflect.set(result, tag, tagValue);
            }
            return result;
        };
    }

    function isNew(instance: any): boolean {
        return Reflect.get(instance, tag) === tagValue;
    }

    it("Only updates nodes if they are different", async () => {
        const [child] = Array.from((await render(tagAsNew(document =>
            document.createElement('div')), '<div></div>')).childNodes);
        assertFalse(isNew(child));
    });

    it("Also does the diff when there are multiple nodes", async () => {
        const updated = (await render(tagAsNew(document => [
                document.createElement('div'),
                document.createTextNode('different'),
                document.createElement('span')
            ]),
            '<div></div>Will-be-replaced<span></span>'));
        assertThat(updated.innerHTML, equals('<div></div>different<span></span>'));
        assertThat(Array.from(updated.childNodes).map(isNew), equals([false, true, false]));
    });

    it("Supports diffing even if the lengths don't match", async () => {
        const updated = (await render(tagAsNew(document => [
                document.createElement('div'),
                document.createTextNode('different'),
                document.createElement('span'),
                document.createElement('img')
            ]),
            '<div></div>Will-be-replaced'));
        assertThat(updated.innerHTML, equals('<div></div>different<span></span><img>'));
        assertThat(Array.from(updated.childNodes).map(isNew), equals([false, true, true, true]));
    });

    it("Will remove excess nodes", async () => {
        const updated = (await render(tagAsNew(document => [
                document.createTextNode('different'),
            ]),
            '<div></div>Will-be-replaced<div></div>'));

        assertThat(updated.innerHTML, equals('different'));
        assertThat(Array.from(updated.childNodes).map(isNew), equals([true]));
    });
});