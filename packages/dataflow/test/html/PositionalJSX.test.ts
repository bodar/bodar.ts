// Never hand DOM nodes to expect(): a failing toBe/toEqual pretty-prints the whole (cyclic) linkedom DOM.
import {describe, expect, spyOn, test} from "bun:test";
import {parseHTML} from "linkedom";
import {PositionalJSX, place} from "@bodar/jsx2dom/PositionalJSX.ts";
import {parseScript, processJSX, toScript} from "../../src/javascript/script-parsing.ts";
import {renderAndExecute} from "../../src/testing/renderAndExecute.ts";

/** Compiles `src` like a block and runs it on one PositionalJSX; `mount` also places the result in <main> like a slot */
function block(src: string, ...params: string[]) {
    const window = parseHTML('<html><body><main></main></body></html>') as any;
    const fn = new Function('jsx', ...params, `return ${toScript(processJSX(parseScript(`(${src})`))).replace(/;$/, '')}`);
    const main = window.document.querySelector('main');
    const run = new PositionalJSX(window).wrap(fn as (jsx: PositionalJSX, ...args: unknown[]) => any);
    const mount = (...args: unknown[]) => {
        const nodes = [run(...args)].flat();
        place(main, Array.from(main.childNodes), nodes);
        return nodes[0];
    };
    return {run, mount, main, window};
}

const all = (root: any, selector: string): any[] => Array.from(root.querySelectorAll(selector));

describe("PositionalJSX in a block", () => {
    test("a re-run that changes sibling text keeps the element (and so focus and caret)", () => {
        const {mount, main} = block(`<div><p>{count} votes</p><input placeholder="Rename"/></div>`, 'count');
        const div = mount(1);
        const [input, text] = [main.querySelector('input'), main.querySelector('p').firstChild];
        expect(mount(2) === div).toBe(true);
        expect(main.querySelector('input') === input && main.querySelector('p').firstChild === text).toBe(true);
        expect(main.textContent).toBe('2 votes');
    });

    test("an in-progress input value survives until the JSX value changes", () => {
        const {mount} = block(`<input value={v} data-n={n}/>`, 'v', 'n');
        const input = mount('', 1);
        input.value = 'Pik';
        mount('', 2);
        expect(input.value).toBe('Pik');
        mount('Pikachu', 3);
        expect(input.value).toBe('Pikachu');
    });

    test("keyed rows keep their elements, only misplaced ones move, closures follow the data", () => {
        const {mount, main, window} = block(`<ul>{items.map(i => <li key={i}><button onclick={() => clicked.push(i)}>{i}</button></li>)}</ul>`, 'items', 'clicked');
        const clicked: string[] = [];
        const ul = mount(['a', 'b', 'c'], clicked);
        const [a, b, c] = all(main, 'li');
        const moves = spyOn(ul, 'insertBefore');
        mount(['c', 'a', 'b'], clicked);
        expect(moves.mock.calls.length).toBe(1);
        const now = all(main, 'li');
        expect(now[0] === c && now[1] === a && now[2] === b).toBe(true);
        for (const button of all(main, 'button')) button.dispatchEvent(new window.Event('click'));
        expect(clicked).toEqual(['c', 'a', 'b']);
    });

    test("unkeyed rows are reused by index: typed text stays at its index, text and handlers follow the data", () => {
        const {mount, main, window} = block(`<ul>{items.map(i => <li>{i}<input/><button onclick={() => clicked.push(i)}>x</button></li>)}</ul>`, 'items', 'clicked');
        const clicked: string[] = [];
        mount(['a', 'b'], clicked);
        const [first] = all(main, 'li');
        first.querySelector('input').value = 'typed for a';
        mount(['b', 'a'], clicked);
        expect(main.querySelector('li') === first).toBe(true);
        expect(first.firstChild.data).toBe('b');
        expect(first.querySelector('input').value).toBe('typed for a');
        first.querySelector('button').dispatchEvent(new window.Event('click'));
        expect(clicked).toEqual(['b']);
    });

    test("a conditional switching call sites rebuilds only that hole, even with the same tag", () => {
        const {mount, main} = block(`<div><b>{n}</b>{x ? <p class="a">A<input/></p> : <p class="a">B<input/></p>}</div>`, 'n', 'x');
        mount(1, true);
        const [b, p] = [main.querySelector('b'), main.querySelector('p')];
        mount(2, false);
        expect(main.querySelector('b') === b).toBe(true);
        expect(main.querySelector('p') !== p).toBe(true);
        expect(main.textContent).toBe('2B');
    });

    test("the same site toggled in one hole shifts by order; a key fixes it", () => {
        const chips = (key: string) => `(() => { const chip = n => <b ${key}>{n}<input/></b>; return <p>{[a ? chip('a') : null, chip('b')]}</p>; })()`;
        for (const [key, keeps] of [['', false], ['key={n}', true]] as const) {
            const {mount, main} = block(chips(key), 'a');
            mount(true);
            const [, b] = all(main, 'b');
            mount(false);
            expect(main.querySelector('b') === b).toBe(keeps);
        }
    });

    test("a helper defined in the block participates, claimed in the caller's hole", () => {
        const {mount, main} = block(`(() => { const chip = n => <b>{n}<input/></b>; return <p>{a ? chip('a') : ''}{chip('b')}</p>; })()`, 'a');
        mount(true);
        const b = all(main, 'b')[1];
        mount(false);
        expect(main.querySelector('b') === b).toBe(true);
    });

    test("a lib-style helper using jsx.createElement still works: rebuilt each run, inside a kept element", () => {
        const icon = (jsx: PositionalJSX, name: string) => jsx.createElement('svg', {'data-name': name}, jsx.createElement('use', {href: '#' + name}));
        const {mount, main} = block(`<button>{icon(jsx, name)}</button>`, 'icon', 'name');
        const button = mount(icon, 'a');
        const svg = main.querySelector('svg');
        mount(icon, 'b');
        expect(main.querySelector('button') === button && main.querySelector('svg') !== svg).toBe(true);
        expect(main.innerHTML).toBe('<button><svg data-name="b"><use href="#b" /></svg></button>');
    });

    test("nested JSX held in a const stays live, even when its parent switches", () => {
        const {run} = block(`(() => { const input = <input/>; return wide ? <div>{input}</div> : <section>{input}</section>; })()`, 'wide');
        const input = run(true).querySelector('input');
        expect(run(false).querySelector('input') === input).toBe(true);
    });

    test("SVG keeps its namespace and its elements", () => {
        const {mount, main} = block(`<svg viewBox="0 0 10 10"><circle r={r}/></svg>`, 'r');
        mount(1);
        const circle = main.querySelector('circle');
        mount(2);
        expect(main.querySelector('circle') === circle).toBe(true);
        expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(circle.getAttribute('r')).toBe('2');
    });

    test("fragments are their nodes, reused", () => {
        const {mount, main} = block(`<><b>{n}</b><i/></>`, 'n');
        mount(1);
        const [b, i] = Array.from(main.childNodes);
        mount(2);
        expect(main.firstChild === b && main.lastChild === i).toBe(true);
        expect(main.innerHTML).toBe('<b>2</b><i></i>');
    });

    test("a Node in a hole is placed as is, moved only when misplaced, never merged into", () => {
        const {mount, main, window} = block(`<p>{parts}</p>`, 'parts');
        const em = window.document.createElement('em');
        mount(['a', em, 'b']);
        mount([em, 'a', 'b']);
        expect(main.innerHTML).toBe('<p><em></em>ab</p>');
        mount(['b', em]);
        expect(main.innerHTML).toBe('<p>b<em></em></p>');
    });

    test("a held node moving between two holes of one parent is not removed by the other hole", () => {
        const {mount, run, main, window} = block(`<div>{flag ? node : ''}{flag ? '' : node}</div>`, 'flag', 'node');
        const node = window.document.createElement('canvas');
        mount(true, node);
        run(false, node);
        run(true, node);
        expect(main.querySelectorAll('canvas').length).toBe(1);
    });

    test("an element without JSX children doesn't own its children: code-added ones survive", () => {
        const {mount, main, window} = block(`<div class="chart" data-n={n}/>`, 'n');
        const div = mount(1);
        div.append(window.document.createElement('svg'));
        mount(2);
        expect(main.querySelectorAll('svg').length).toBe(1);
    });

    test("an element with JSX children owns only the nodes it placed: code-added ones are left alone", () => {
        const {mount, main, window} = block(`<div class="chart"><h3>Votes {n}</h3></div>`, 'n');
        const div = mount(1);
        div.append(window.document.createElement('svg'));
        mount(2);
        expect(main.innerHTML).toBe('<div class="chart"><h3>Votes 2</h3><svg></svg></div>');
    });

    test("<select value> is written after its options exist, and every run (its options can change under it)", () => {
        const {mount, window} = block(`<select value={v}>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>`, 'v', 'opts');
        const options: number[] = [];
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
        Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
            configurable: true, get: () => '', set(this: Element) { options.push(this.querySelectorAll('option').length); }
        });
        try {
            mount('b', ['a', 'b']);
            mount('c', ['a', 'b', 'c']);
            mount('c', ['a', 'b', 'c']);
        } finally {
            Object.defineProperty(window.HTMLSelectElement.prototype, 'value', descriptor ?? {configurable: true, value: undefined});
        }
        expect(options).toEqual([2, 3, 3]);
    });

    test("style objects are diffed per key: removed keys go, code-set ones stay", () => {
        const {mount} = block(`<div style={s}/>`, 's');
        const div = mount({color: 'red', width: '1px'});
        div.style.setProperty('background', 'blue');
        mount({color: 'red'});
        expect(div.style.width).toBe('');
        expect(div.style.color).toBe('red');
        expect(div.style.background).toBe('blue');
        mount(undefined);
        expect(div.hasAttribute('style')).toBe(false);
    });

    test("attributes and boolean attributes are removed and toggled; checked is also a property", () => {
        const {mount, window} = block(`<input type="checkbox" title={t} checked={c} disabled={d} aria-pressed={c}/>`, 't', 'c', 'd');
        Object.defineProperty(window.HTMLInputElement.prototype, 'checked', {configurable: true, writable: true, value: false}); // linkedom has no checked property
        try {
            const input = mount('tip', true, true);
            expect(input.checked && input.hasAttribute('checked') && input.hasAttribute('disabled') && input.getAttribute('title') === 'tip').toBe(true);
            mount(undefined, false, false);
            expect(input.checked || input.hasAttribute('checked') || input.hasAttribute('disabled') || input.hasAttribute('title')).toBe(false);
            expect(input.getAttribute('aria-pressed')).toBe('false');
            input.checked = true; // the user ticks it: an unchanged JSX value leaves it alone
            mount(undefined, false, false);
            expect(input.checked).toBe(true);
        } finally {
            delete window.HTMLInputElement.prototype.checked;
        }
    });

    test("null, undefined and false render nothing; 0 and adjacent text holes render", () => {
        const {mount, main} = block(`<p>{a}{b} - {c}</p>`, 'a', 'b', 'c');
        mount('1', '2', '3');
        mount(['x', false], null, 0);
        expect(main.textContent).toBe('x - 0');
        mount(undefined, '', '');
        expect(main.textContent).toBe(' - ');
    });

    test("a duplicate key warns once and gets fresh DOM", () => {
        const {mount, main} = block(`<ul>{items.map(i => <li key={i}>{i}</li>)}</ul>`, 'items');
        const warn = spyOn(console, 'warn').mockImplementation(() => {});
        try {
            mount(['a', 'a', 'b']);
            const [a] = all(main, 'li');
            mount(['a', 'b', 'a']);
            expect(main.textContent).toBe('aba');
            expect(main.querySelector('li') === a).toBe(true);
            expect(warn.mock.calls.length).toBe(1);
        } finally {
            warn.mockRestore();
        }
    });

    test("key is consumed, never written to the DOM", () => {
        const {mount, main} = block(`<ul>{['a'].map(x => <li key={x}>{x}</li>)}</ul>`);
        mount();
        expect(main.innerHTML).toBe('<ul><li>a</li></ul>');
    });

    test("a handler is a pointer: the latest closure runs, a removed one doesn't", () => {
        const {mount, window} = block(`<button onclick={h}/>`, 'h');
        const calls: number[] = [];
        const button = mount(() => calls.push(1));
        mount(() => calls.push(2));
        button.dispatchEvent(new window.Event('click'));
        mount(undefined);
        button.dispatchEvent(new window.Event('click'));
        expect(calls).toEqual([2]);
    });

    test("holes run in source order, attributes included", () => {
        const {run} = block(`<div>{log.push('child')}<span title={log.push('attr')}/></div>`, 'log');
        const log: string[] = [];
        run(log);
        expect(log).toEqual(['child', 'attr']);
    });

    test("a run that throws is accepted as is: what it claimed is kept, what it didn't reach is rebuilt", () => {
        const {run} = block(`(() => { const a = <canvas id="a"/>; if (fail) throw new Error('boom'); return [a, <canvas id="b"/>]; })()`, 'fail');
        const [a, b] = run(false);
        expect(() => run(true)).toThrow('boom');
        const [a2, b2] = run(false);
        expect(a2 === a).toBe(true);
        expect(b2 !== b).toBe(true);
    });

    test("a keyed row moving between two holes of one parent keeps its element, state and order", () => {
        const {mount, main} = block(`(() => { const row = p => <li key={p}><input/>{p}</li>; return <ul>{pinned.map(row)}<hr/>{rest.map(row)}</ul>; })()`, 'pinned', 'rest');
        mount([], ['a', 'b', 'c']);
        const b = all(main, 'li')[1];
        b.querySelector('input').value = 'B';
        mount(['b'], ['a', 'c']);
        expect(main.querySelector('li') === b && b.querySelector('input').value === 'B').toBe(true);
        expect(main.textContent).toBe('bac');
        mount([], ['a', 'b', 'c']);
        expect(main.textContent).toBe('abc');
    });

    test("a node moving from an outer hole into an inner element's hole and back stays one node", () => {
        const {mount, main, window} = block(`<div>{inner ? null : node}<p>{inner ? node : null}</p></div>`, 'node', 'inner');
        const node = window.document.createElement('canvas');
        mount(node, false);
        mount(node, true);
        expect(main.querySelectorAll('canvas').length === 1 && main.querySelector('p canvas') === node).toBe(true);
        mount(node, false);
        expect(main.querySelector('div > canvas') === node && main.querySelector('p').childNodes.length === 0).toBe(true);
    });

    test("JSX built by a handler after its run is fresh DOM: a click-to-append log keeps every entry", () => {
        const {mount, main, window} = block(`<button onclick={() => log.append(<li>{'entry ' + n}</li>)}>{n}</button>`, 'n', 'log');
        const log = window.document.createElement('ul');
        for (const n of [0, 1, 2]) {
            mount(n, log);
            main.querySelector('button').dispatchEvent(new window.Event('click'));
        }
        expect(log.textContent).toBe('entry 0entry 1entry 2');
    });

    test("a helper called from another block (outside its own block's run) builds fresh DOM and never takes that block's elements", () => {
        const a = block(`(() => { const badge = x => <b>{x}</b>; return {badge, out: extra ? [badge(n), badge('extra')] : [badge(n)]}; })()`, 'n', 'extra');
        const {badge} = a.run(1, false);
        const p = block(`<p>{badge(m)}</p>`, 'badge', 'm').run(badge, 'from b');
        const theirs = p.querySelector('b');
        const {out} = a.run(2, true);
        expect(out.every((b: Node) => b !== theirs) && p.querySelector('b') === theirs).toBe(true);
        expect(p.outerHTML).toBe('<p><b>from b</b></p>');
    });
});

describe("PositionalJSX in a page", () => {
    async function page(blocks: string) {
        const html = `<html><body><script type="module" is="reactive">const state = mutable(0); document.body.set = v => state.value = v;</script>${blocks}</body></html>`;
        const {browser, idle} = await renderAndExecute(parseHTML as any, html);
        await idle.fired();
        const document = browser.document as any;
        return {
            document, $: (s: string) => document.querySelector(s), $$: (s: string) => all(document, s),
            async settle() {
                await idle.fired();
                await new Promise(r => setTimeout(r, 0));
            },
            async set(v: unknown) {
                document.body.set(v);
                await this.settle();
            }
        };
    }

    const R = (s: string) => `<script type="module" is="reactive">${s}</script>`;

    test("a display()ed canvas is the same element every run, and dependents see the live one", async () => {
        const p = await page(R(`document.body.seen = [];`) + R(`const canvas = display(<canvas width={300} data-s={state}/>);`) + R(`document.body.seen.push(canvas);`));
        const canvas = p.$('canvas');
        await p.set(1);
        await p.set(2);
        expect(p.$('canvas') === canvas && p.document.body.seen.every((c: Node) => c === canvas)).toBe(true);
        expect(canvas.getAttribute('data-s')).toBe('2');
    });

    test("several display() calls, the first conditional: the second keeps its own element and state", async () => {
        const p = await page(R(`if (state === 0) display(<input id="a"/>); display(<input id="b"/>);`));
        const b = p.$('#b');
        b.value = 'B-text';
        await p.set(1);
        expect(p.$$('input').length).toBe(1);
        expect(p.$('input') === b && b.value === 'B-text').toBe(true);
    });

    test("view(<input/>) keeps the element and its typed value when the block re-runs", async () => {
        const p = await page(R(`const name = view(<input name="name" data-s={state}/>);`) + R(`display(<output>{name}</output>)`));
        const input = p.$('input');
        input.value = 'Pikachu';
        await p.set(1);
        expect(p.$('input') === input && input.value === 'Pikachu').toBe(true);
    });

    test("a handler that builds JSX and changes state appends a new element every click", async () => {
        const p = await page(`<aside></aside>` + R(`display(<button onclick={() => { document.querySelector('aside').append(<li>{'entry ' + state}</li>); document.body.set(state + 1); }}>{state}</button>)`));
        for (let i = 0; i < 3; i++) {
            p.$('button').dispatchEvent(new p.document.defaultView.Event('click'));
            await p.settle();
        }
        expect(p.$('aside').textContent).toBe('entry 0entry 1entry 2');
    });

    test("an async block superseded before it resumes still keeps its input and typed text", async () => {
        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
        const p = await page(R(`await new Promise(r => setTimeout(r, 30)); display(<input data-s={state}/>);`));
        await sleep(50);
        const input = p.$('input');
        input.value = 'typed';
        p.document.body.set(1);
        await sleep(5);
        p.document.body.set(2);
        await sleep(80);
        expect(p.$('input') === input && input.value === 'typed').toBe(true);
        expect(input.getAttribute('data-s')).toBe('2');
    });
});
