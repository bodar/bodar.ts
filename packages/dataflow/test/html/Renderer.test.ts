import {describe, expect, it} from "bun:test";
import {parseHTML} from "linkedom";
import {Display} from "../../src/api/display.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {chain} from "@bodar/yadic/chain.ts";
import {SlotRenderer} from "../../src/html/SlotRenderer.ts";

describe("Renderer", () => {
    async function render(fun: (doc: Document, display: (v: any) => any) => any, initialSlot: string = ''): Promise<Element> {
        const globals = parseHTML(`<body><slot name="output">${initialSlot}</slot></body>`);
        const display = Display.for('output', chain({
            reactiveRoot: globals.document.documentElement
        }, globals));

        // Execute the function which should call display() to render values
        fun(globals.document, display);

        // Wait for the microtask flush
        await Promise.resolve();
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

    it("Can render a DocumentFragment", async () => {
        assertThat((await render((document, display) => {
            const fragment = document.createDocumentFragment();
            fragment.append(
                document.createElement('div'),
                document.createTextNode('Hello, world!'),
                document.createElement('span')
            );
            return display(fragment);
        })).innerHTML, is('<div></div>Hello, world!<span></span>'));
    });

    const tag = Symbol('tag');
    const tagValue = 'new';

    function tagAsNew<T extends object>(value: T): T {
        Reflect.set(value, tag, tagValue);
        return value;
    }

    function isNew(instance: any): boolean {
        return Reflect.get(instance, tag) === tagValue;
    }

    it("Replaces a node that is equal but not the same node", async () => {
        const [child] = Array.from((await render((document, display) =>
            display(tagAsNew(document.createElement('div'))), '<div></div>')).childNodes);
        assertThat(isNew(child), is(true));
    });

    it("Will remove excess nodes", async () => {
        const updated = (await render((document, display) => {
            return display(tagAsNew(document.createTextNode('different')));
        }, '<div></div>Will-be-replaced<div></div>'));

        assertThat(updated.innerHTML, equals('different'));
        assertThat(Array.from(updated.childNodes).map(isNew), equals([true]));
    });

    describe("by identity", () => {
        const globals = parseHTML('<body><slot name="output"></slot></body>');
        const renderer = new SlotRenderer(globals);
        const slot = globals.document.querySelector('slot')!;
        const [a, b, c] = ['a', 'b', 'c'].map(id => Object.assign(globals.document.createElement('p'), {id}));
        const ids = () => Array.from(slot.childNodes).map(n => (n as Element).id ?? n.textContent).join();

        it("keeps the same nodes, moves only misplaced ones and removes the rest", () => {
            renderer.render(slot, [a, b, c]);
            const moved: Node[] = [];
            const insertBefore = slot.insertBefore.bind(slot);
            slot.insertBefore = (node, ref) => (moved.push(node), insertBefore(node, ref));
            renderer.render(slot, [c, a]);
            expect(ids()).toBe('c,a');
            expect(moved.length === 1 && moved[0] === c).toBe(true);
            expect(slot.firstChild === c && slot.lastChild === a).toBe(true);
        });

        it("flattens arrays, e.g. a fragment's nodes", () => {
            renderer.render(slot, [[a, ['x', b]], 1]);
            expect(slot.innerHTML).toBe('<p id="a"></p>x<p id="b"></p>1');
        });
    });
});
