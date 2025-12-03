import {describe, it} from "bun:test";
import {parseHTML} from "linkedom";
import {Renderer} from "../../src/html/Renderer.ts";
import {BaseGraph} from "../../src/BaseGraph.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {assertFalse, assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";

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

    it("Only updates nodes if they are different", async () => {
        let elememt: HTMLElement | undefined;
        const children = (await render(document => {
            elememt = document.createElement('div');
            elememt.setAttribute('id', 'test');
            // Node.isEqualNode won't see this custom property
            // so it will think the nodes are the same and not replace it
            Reflect.set(elememt, '@tag@', 'new');
            return elememt;
            },
            '<div id="test"></div>')).childNodes;
        // If it had replaced it, then this will be true
        const newChild = children[0];
        assertFalse(Reflect.get(newChild, '@tag@') === 'new');
    });
});