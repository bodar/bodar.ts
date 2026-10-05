// Never hand DOM nodes to expect(): a failing toBe/toEqual pretty-prints the whole (cyclic) linkedom DOM.
import {describe, expect, it} from "bun:test";
import {parseHTML} from "linkedom";
import {place, PositionalJSX, stableListener} from "../src/PositionalJSX.ts";
import {JSX2DOM} from "../src/JSX2DOM.ts";
import {chain} from "@bodar/yadic/chain.ts";

describe("PositionalJSX", () => {
    const html = parseHTML('');

    it("element() hands back last run's element made at the same site, patching only what changed", () => {
        const render = new PositionalJSX(html).wrap((jsx, n: number) => jsx.element(1, 'p', {class: 'count'}, 'Votes: ', () => n) as Element);
        const p = render(1);
        const text = p.lastChild;
        expect(render(2) === p && p.lastChild === text).toBe(true);
        expect(p.outerHTML).toBe('<p class="count">Votes: 2</p>');
    });

    it("children are thunks run inside their parent's hole, so a different site in a hole is a miss", () => {
        const render = new PositionalJSX(html).wrap((jsx, site: number) => jsx.element(1, 'div', null, () => jsx.element(site, 'i', null)) as Element);
        const i = render(2).firstChild;
        expect(render(2).firstChild === i).toBe(true);
        expect(render(3).firstChild !== i).toBe(true);
    });

    it("createElement still builds fresh DOM", () => {
        const jsx = new PositionalJSX(html);
        expect(jsx.createElement('p', null) !== jsx.createElement('p', null)).toBe(true);
    });

    it("JSX made after its run returned is fresh DOM, remembered nowhere", () => {
        let later: () => Node = () => html.document.createTextNode('');
        const render = new PositionalJSX(html).wrap(jsx => {
            later = () => jsx.element(2, 'li', null) as Node;
            return jsx.element(1, 'ul', null) as Node;
        });
        const ul = render();
        const [a, b] = [later(), later()];
        expect(render() === ul).toBe(true);
        const c = later();
        expect(a !== b && b !== c && a !== c).toBe(true);
    });

    it("an async run claims until its promise settles; a superseded one builds fresh DOM and hands on last run's claims", async () => {
        const gates: (() => void)[] = [];
        const render = new PositionalJSX(html).wrap(async jsx => {
            await new Promise<void>(r => gates.push(r));
            return jsx.element(1, 'input', null) as Node;
        });
        const first = render();
        gates.shift()!();
        const input = await first;
        const [stale, live] = [render(), render()];
        gates.shift()!();
        gates.shift()!();
        const [s, l] = await Promise.all([stale, live]);
        expect(l === input && s !== input).toBe(true);
    });

    it("place() moves only misplaced nodes and leaves nodes it doesn't own alone", () => {
        const parent = html.document.createElement('div');
        const [a, b, foreign] = ['a', 'b', 'f'].map(t => html.document.createTextNode(t));
        place(parent, [], [a, b]);
        parent.append(foreign);
        place(parent, [a, b], [b]);
        expect(parent.textContent).toBe('bf');
    });
});

describe("stableListener", () => {
    const html = parseHTML('');
    const jsx = new JSX2DOM(chain({onEventListener: stableListener}, html));
    const click = (element: Node) => element.dispatchEvent(new html.Event('click'));

    it("calls the handler once, with the element as this", () => {
        const calls: unknown[] = [];
        const button = jsx.createElement('button', {onclick: function (this: unknown) { calls.push(this); }});
        click(button);
        expect(calls.length).toBe(1);
        expect(calls[0] === button).toBe(true);
    });

    it("a new handler is a pointer swap: one listener, the latest closure", () => {
        const calls: string[] = [];
        const button = jsx.createElement('button', {onclick: () => calls.push('old')});
        stableListener(button, 'click', () => calls.push('new'));
        click(button);
        expect(calls).toEqual(['new']);
    });

    it("no listener clears the handler", () => {
        const calls: string[] = [];
        const button = jsx.createElement('button', {onclick: () => calls.push('old')});
        stableListener(button, 'click');
        click(button);
        expect(calls).toEqual([]);
    });
});
