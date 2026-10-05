/** @module
 * JSX that hands back last run's element made at the same place, so re-running code keeps its DOM
 * (focus, caret, typed text, scroll, a canvas) and writes only what the JSX changed since last run.
 *
 * "The same place" is the JSX call site (`site`), in the current parent's child hole (or the run itself at
 * top level), plus `key`, or without one the order among uses of that site in that hole.
 * Children are thunks, so a parent is claimed before its children run. `createElement` still builds fresh DOM.
 */
import {type Attributes, JSX2DOM, type JSX2DOMDependencies, type SupportedElement} from './JSX2DOM.ts';

/** What one element, fragment or run claimed and placed: last run's and this run's */
class Memory {
    last = new Map<string, Memory>();
    next = new Map<string, Memory>();
    counts = new Map<string, number>();
    attributes: Attributes = {};
    nodes: Node[] = [];
    texts: Text[][] = [];

    constructor(readonly tag: string | null, readonly node?: SupportedElement) {
    }

    /** Last run's claims become what is reusable (`carry`: plus what that run didn't claim); a fresh claim set starts */
    swap(carry = false): this {
        [this.last, this.next] = [carry ? new Map([...this.last, ...this.next]) : this.next, new Map()];
        this.counts.clear();
        return this;
    }
}

const PROPERTIES = new Set(['value', 'checked', 'selected']);
/** The text each hole's Text node was last given: diffed against the JSX, not the DOM, so an in-place edit survives */
const written = new WeakMap<Text, string>();

/** JSX2DOM plus `element(site, tag, attributes, ...children)`, which reuses last run's DOM made at the same place */
export class PositionalJSX extends JSX2DOM {
    private readonly top = new Memory(null);
    /** Shared by this instance and its runs' handles (see wrap()) */
    private readonly state = {at: {memory: this.top, hole: 0}, generation: 0, open: false, warned: new Set<string>()};
    /** The run a handle belongs to: it claims only while that run is the current one and still open */
    private readonly generation: number = 0;

    constructor(deps: JSX2DOMDependencies = globalThis) {
        super({document: deps.document, Node: deps.Node, onEventListener: stableListener});
    }

    /** `fun`, called with this jsx first: each call is a run, claiming until `fun` returns or its promise settles.
     *  JSX made outside the current run (handlers, timers, generators resumed later, a run after a newer one
     *  started) builds fresh DOM and is remembered nowhere. */
    wrap<A extends unknown[], R>(fun: (jsx: PositionalJSX, ...args: A) => R): (...args: A) => R {
        return (...args) => {
            const jsx = this.run();
            const close = () => {
                if (this.state.generation === jsx.generation) this.state.open = false;
            };
            let result: R;
            try {
                result = fun(jsx, ...args);
            } catch (e) {
                close();
                throw e;
            }
            if (typeof (result as any)?.then === 'function') (result as PromiseLike<unknown>).then(close, close);
            else close();
            return result;
        };
    }

    /** Starts the next run. A run that throws is accepted as is: its partial claims are what the next run can
     *  reuse and anything it didn't reach is rebuilt. Revisit if that causes bugs.
     *  A run still open here (an async run superseded before it finished) also hands on what it didn't claim. */
    private run(): PositionalJSX {
        const {state} = this;
        this.top.swap(state.open);
        state.at = {memory: this.top, hole: 0};
        state.open = true;
        return Object.create(this, {generation: {value: ++state.generation}});
    }

    element(site: number | string, tag: string | null, attributes: Attributes | null, ...children: unknown[]): Node | Node[] {
        const {key, ...rest} = attributes ?? {};
        const memory = this.claim(site, tag, key);
        const nodes = children.flatMap((child, hole) => this.hole(memory, hole, child));
        const {node} = memory;
        if (!node) return nodes;
        place(node, memory.nodes, nodes);
        memory.nodes = nodes;
        this.update(node, memory, rest);
        return node;
    }

    private claim(site: number | string, tag: string | null, key: unknown): Memory {
        const {state} = this;
        if (!state.open || this.generation !== state.generation) return this.create(tag);
        const {memory: parent, hole} = state.at;
        let id = `${site}:${String(key)}`;
        if (key == null) {
            const n = parent.counts.get(id = `${hole}/${site}`) ?? 0;
            parent.counts.set(id, n + 1);
            id += `#${n}`;
        } else if (parent.next.has(id)) {
            if (!state.warned.has(id)) console.warn(`PositionalJSX: duplicate key "${String(key)}" in one parent, it gets fresh DOM`);
            state.warned.add(id);
            return this.create(tag);
        }
        const last = parent.last.get(id);
        const memory = last?.tag === tag ? last.swap() : this.create(tag);
        parent.next.set(id, memory);
        return memory;
    }

    private create(tag: string | null): Memory {
        return new Memory(tag, tag === null ? undefined : this.createElement(tag, null));
    }

    private hole(memory: Memory, hole: number, child: unknown): Node[] {
        const {state} = this, at = state.at;
        state.at = {memory, hole};
        let value: unknown;
        try {
            value = typeof child === 'function' ? child() : child;
        } finally {
            state.at = at;
        }
        const {document, Node} = this.deps;
        const old = memory.texts[hole] ?? [], texts: Text[] = [];
        const nodes = flatten(value, Node).map(v => {
            if (v instanceof Node) return v;
            const data = String(v), text = old[texts.length] ?? document.createTextNode(data);
            if (written.get(text) !== data) written.set(text, text.data = data);
            texts.push(text);
            return text;
        });
        memory.texts[hole] = texts;
        return nodes;
    }

    /** Attributes changed since last run, written after the children (so `<select value>` sees its options) */
    private update(node: SupportedElement, memory: Memory, attributes: Attributes): void {
        const last = memory.attributes;
        for (const name of names(last, attributes)) {
            const was = last[name], now = attributes[name];
            if (Object.is(was, now)) continue;
            if (name.startsWith('on') && typeof was === 'function' && typeof now !== 'function') stableListener(node, name.substring(2));
            if (name === 'style' && isObject(was) && isObject(now)) {
                for (const p of names(was, now)) {
                    if (was[p] !== now[p]) Reflect.set(node.style, p, now[p] == null ? '' : String(now[p]));
                }
            } else {
                node.removeAttribute(name);
                this.addAttributes(node, {[name]: now});
            }
            if (PROPERTIES.has(name) && name in node) Reflect.set(node, name, name === 'value' ? now ?? '' : now === true);
        }
        // A select's options can change under an unchanged value (reused by index, or arriving later): always re-apply it
        if (node.localName === 'select' && attributes.value != null && Object.is(last.value, attributes.value)) Reflect.set(node, 'value', attributes.value);
        memory.attributes = attributes;
    }
}

/** Makes `parent` hold `nodes` in order where it held `owned`: drops owned nodes no longer wanted,
 *  moves only misplaced ones and leaves every other child (added by code) alone */
export function place(parent: Node, owned: Node[], nodes: Node[]): void {
    const wanted = new Set(nodes);
    for (const node of owned) if (!wanted.has(node) && node.parentNode === parent) parent.removeChild(node);
    let cursor = parent.firstChild;
    for (const node of nodes) {
        while (cursor && cursor !== node && !wanted.has(cursor)) cursor = cursor.nextSibling;
        if (cursor === node) cursor = cursor.nextSibling;
        else move(parent, node, cursor);
    }
}

/** moveBefore keeps focus, animations and iframes alive across a move, where the browser has it */
function move(parent: Node, node: Node, before: Node | null): void {
    const moveBefore = (parent as any).moveBefore;
    if (moveBefore && node.isConnected && parent.isConnected) moveBefore.call(parent, node, before);
    else parent.insertBefore(node, before);
}

/** A child value as a flat list: arrays flattened, a fragment as its nodes, null, undefined and false as nothing */
export function flatten(value: unknown, NodeType: typeof Node): unknown[] {
    if (value === null || value === undefined || value === false) return [];
    if (Array.isArray(value)) return value.flatMap(v => flatten(v, NodeType));
    if (value instanceof NodeType && value.nodeType === 11) return Array.from(value.childNodes);
    return [value];
}

const names = (a: object, b: object) => new Set([...Object.keys(a), ...Object.keys(b)]);

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/** Stable event listeners: one listener per element and event, calling the element's current handler,
 *  so giving a kept element a new handler is a pointer swap */
const handlers = new WeakMap<EventTarget, Record<string, EventListener | undefined>>();
const dispatcher = {handleEvent: (e: Event) => handlers.get(e.currentTarget!)?.[e.type]?.call(e.currentTarget, e)};

/** JSX2DOM's onEventListener hook: swaps the listener JSX2DOM just added for the stable dispatcher (no listener: clears the handler) */
export function stableListener(element: SupportedElement, eventName: string, listener?: EventListener): void {
    if (listener) element.removeEventListener(eventName, listener);
    element.addEventListener(eventName, dispatcher);
    let record = handlers.get(element);
    if (!record) handlers.set(element, record = {});
    record[eventName] = listener;
}
