# Runtime API reference

All names below are **implicit inside reactive blocks** — never import them there. Source:
`packages/dataflow/src/api/*.ts`, `src/runtime.ts`, `src/toAsyncIterable.ts`, `src/PullNode.ts`,
`src/Invalidator.ts`, `src/html/NodeDefinition.ts`.

## Contents
1. How the names get into a block
2. display / view / input / events / observe / mutable / raw / now / width / root / invalidator
3. How values flow between blocks (normalisation)
4. Scheduling: throttle, backpressure, glitches
5. Invalidation (cleanup)
6. Errors
7. Using the runtime outside HTML (Graph / BaseGraph)
8. Gotcha list

---

## 1. How the names get into a block

| Name | Mechanism (emitted code) | In the block you see |
|---|---|---|
| `observe`, `events`, `input`, `mutable`, `raw` | module import from `@bodar/dataflow/runtime.ts`, filtered out of graph inputs (`IMPLICIT_IMPORTS`) | the function |
| `display` | `const display = Display.for("<key>", _runtime_);` injected at top of block | per-block function bound to `<slot name=key>` |
| `view` | `const view = View.for(display);` | per-block function |
| `width` | per-block graph node `width_<key>` = `Width.for(key, _runtime_)`; `const width = width_<key>;` | latest width number |
| `now` | shared graph node `"now"` = `now()` generator | latest `Date.now()` number |
| `root` | shared graph node `"root"` = `_runtime_.reactiveRoot` (parent of the runtime script) | the island element, or `<body>` |
| `jsx` | the block is registered as `new PositionalJSX(_runtime_).wrap((jsx, …) => …)` (one instance per block, kept across runs) | `PositionalJSX` (JSX compiles to `jsx.element(site, …)`) |
| `invalidator` | graph globals are `chain({invalidator}, globalThis)` | the runtime's `Invalidator` |
| anything else unresolved | auto-created global node `() => Reflect.get(globals, name)` | snapshot of `globalThis[name]` (or `undefined`) |

Consequences:
- Declaring your own top-level `input`, `events`, `observe`, `mutable` or `raw` makes it invisible
  to other blocks (they get the runtime function). `display`, `view`, `width` are dropped from
  outputs. Avoid `now`, `root`, `jsx`, `invalidator`, `_runtime_` as names too.
- `import {display} from "@bodar/dataflow/runtime.ts"` inside a block either produces a duplicate
  `const display` (single-expression blocks) or binds the placeholder, which throws when called;
  likewise `import {view} ...` gives a placeholder that throws.
  `display`, `view` and `width` exported from `api/*.ts` are placeholders (throw / `-1`) that only
  work after the transformer rewrites them.

`runtime.ts` exports: `display, Display, view, View, width, Width, input, events, observe,
mutable, now, raw, BaseGraph, Idle, Throttle, Invalidator, PositionalJSX` and
`runtime(config?: {scriptId?, idle?}, global = globalThis)`. In ordinary (non-reactive) JS use
`@bodar/dataflow/runtime.ts` for `events`/`mutable`/`raw` (there are no `api/events.ts`,
`api/mutable.ts`, `api/raw.ts` package exports).

## 2. Functions

### `display(value)`
```ts
type SupportedValue = Node | string | number | SupportedValue[];
display<T extends SupportedValue>(value: T): T
```
- Returns its argument: `const canvas = display(<canvas width={width} height="100"/>);`
- Calls are buffered and flushed on the next throttle tick (animation frame). A flush makes the
  slot's children the batch: the same node (by identity, e.g. a reused JSX element) is kept and moved
  only if misplaced; other nodes are removed.
- Multiple calls in one run all show, in order: `display('a'); display(1); display(<b/>)` → `a1<b/>`.
- A later batch (next run, or a later frame inside a `for await` loop) replaces the earlier one:
  `for await (const i of src()) display(i);` shows only the latest `i`.
- **Only `Node` (incl. DocumentFragment), `string`, `number` and arrays of them (a fragment's
  nodes) render.** Booleans, `null`, `undefined`, objects and Promises render nothing, silently.
- **Implicit display**: a block that is exactly one expression statement and doesn't mention
  `display`/`view` becomes `return display(expr)`. Any top-level declaration (incl. an import)
  disables it.

### `view(element)`
```ts
view(el: HTMLElement): AsyncIterator<value>   // = input(display(el))
```
- Displays the element in this block's slot and returns its value stream.
- Same block: you hold the iterator. Other blocks: the current value; they re-run on each `input`.
- Works with anything that has `.value` and fires `input` events — e.g. `@observablehq/inputs`:
  ```js
  import {range} from "@observablehq/inputs";        // own block
  const volume = view(range([0, 100], {label: "Volume", step: 1, value: 50}));
  ```
- A `view(...)` block that re-runs gets the same element back (positional JSX), so the typed value
  and focus survive; its `value` is only rewritten when the JSX `value` changes. A re-run still
  creates a new value stream, starting from the element's current value.

### `input(element, eventType?, valueFn?)`
```ts
type SupportedInputs = HTMLInputElement | HTMLSelectElement;
input<E, R>(element: E, eventType = eventOf(element), value: (el: E) => R = valueOf): AsyncIterator<R>
// = events(element, eventType, () => value(element), value(element))
```
- Does not display. Use when you place the element yourself:
  ```html
  <script type="module" is="reactive">
      const myInput = <input type="text" placeholder="Type here..."/>;
      const myValue = input(myInput);
  </script>
  <div>Enter text: <script type="module" is="reactive">myInput</script></div>
  <div>You typed: <script type="module" is="reactive">myValue</script></div>
  ```
- The extractor receives the **element**, not the event: `input(el, 'input', el => el.value.toUpperCase())`.
- Initial value = extractor(element) at call time (emitted immediately unless `undefined`).

| `element.type` | default event | value |
|---|---|---|
| `range`, `number` | `input` | `valueAsNumber` (NaN if empty) |
| `date` | `input` | `valueAsDate` (Date or null) |
| `checkbox` | `click` | `checked` |
| `button`, `submit` | `click` | `value` |
| `file` | `change` | `multiple ? files : files[0]` |
| `select-multiple` | `input` | `string[]` of selected values |
| anything else (`text`, `textarea`, `select-one`, `color`, `radio`, `datetime-local`, custom) | `input` | `value` (string) |

`datetime-local` is a string (docs table says Date — it isn't). Radios have no group handling:
wire radio groups with `onchange` handlers writing a mutable, or use a `<select>`.

### `events(target, type, valueFn, initialValue?)`
```ts
events<E extends EventTarget, EV extends Event, R>(element: E, event: string, value: (event: EV) => R, initialValue?: R): AsyncIterator<R>
```
- Any `EventTarget`: `window`, `document`, elements, `AudioContext`, `WebSocket`, a `Mutable`…
- Listener removed when iteration ends (block invalidated / page torn down).
- **Return non-`undefined`** from `valueFn`: `undefined` terminates the stream
  (`events(btn, 'click', () => {})` stops after one click). Use `ev => ev` or `() => Date.now()`.
- Without `initialValue` dependents wait for the first event.
```js
const windowWidth = events(window, 'resize', () => window.innerWidth, window.innerWidth);
const pointer = events(document, 'pointermove', ev => [ev.clientX, ev.clientY], [0, 0]);
const state = events(context, 'statechange', () => context.state, context.state);
```

### `observe(init, initialValue?, terminate?)`
```ts
observe<T>(init: (notify: (t: T | undefined) => any) => any, value?: T,
           terminate: (t: T | undefined) => boolean = t => t === undefined): AsyncGenerator<T>
```
- `init` runs **immediately**, when `observe()` is called, so nothing notified after that is ever lost —
  not even before the first pull. `initialValue` (if not `undefined`) is yielded first.
- `notify(v)` pushes a value; values notified faster than they are consumed coalesce (latest wins):
  the consumer always ends on the latest value. Any notify before the first pull (including a
  synchronous one inside `init`) replaces `initialValue`, so `events(el, type, f, el.current)` and
  `observe(n => { listen(n); n(current); … })` both replay the current value without a gap or a duplicate.
- Because it subscribes on creation, an `observe` that is never iterated still needs disposing:
  `return()` or `[Symbol.asyncDispose]` runs the cleanup (the `Invalidator` does this for block outputs).
- Ends when `terminate(v)` — by default `notify(undefined)`.
- If `init` returns a **zero-parameter** function it is called (awaited) on end/return/invalidation.
  A cleanup that declares parameters is silently never called.
```js
const pointer = observe(notify => {
    const handler = e => notify([e.clientX, e.clientY]);
    document.addEventListener('pointermove', handler);
    return () => document.removeEventListener('pointermove', handler);
}, [0, 0]);

const tick = observe(notify => {                     // timer as a source
    const id = setInterval(() => notify(Date.now()), 1000);
    return () => clearInterval(id);
}, Date.now());
```
Differs from Observable's `Generators.observe` by the `initialValue`/`terminate` params.

### `mutable(value)`
```ts
class Mutable<T> extends EventTarget implements AsyncIterable<T> {
    get value(): T
    set value(v: T)               // dispatches 'change' on EVERY set (no equality check)
    update(fn: (t: T) => T): this // this.value = fn(this.value)
}
mutable<T>(value: T): Mutable<T>
```
```html
<script type="module" is="reactive">
    const count = mutable(0);
    const increment = () => count.value++;
    const list = mutable([]);
    const add = item => list.update(xs => [...xs, item]);   // after `list`: same-block order matters
</script>
<script type="module" is="reactive">
    <button onclick={increment}>Count: {count}</button>
</script>
```
- Declaring block: the `Mutable`. Other blocks: the plain current value (re-run on change).
  So writes happen **only** in the declaring block or via closures it exports.
- `update` must return the value; returning the same mutated array still notifies, but prefer new
  values (`[...xs, x]`, `filter`, `map`) — consumers holding the old reference see it mutate.
- In-place mutation without a set (`count.value.push(x)`) notifies nothing.
- Setting `undefined` ends the stream — use `null` for "empty".
- If the declaring block has reactive inputs, every re-run creates a **new** Mutable (state reset).
  Keep state blocks dependency-free (globals like `crypto` are fine).
- Rapid sets coalesce; dependents see the latest.

### `raw(value)`
```ts
class Raw<T> implements AsyncIterable<T> { constructor(public readonly value: T) }  // yields value once
raw<T>(value: T): Raw<T>
```
Opts a value out of automatic iteration so other blocks receive the thing itself — e.g. a
generator function to call yourself:
```js
const slow_source = raw(async function* () { let i = 0; while (true) { yield i++; await new Promise(r => setTimeout(r, 1000)); } });
// another block:
for await (const i of slow_source()) display(i);
```
`raw(promise)` is **still awaited** (async generators await yielded thenables), despite the docs.
To pass a promise un-awaited, wrap it: `raw({promise})` or `raw(() => p)`.

### `now`
`function* now() { while (true) yield Date.now(); }` as one shared node. In blocks `now` is a
number updated once per frame; any block referencing it re-runs every frame (keep it cheap: its
JSX elements are reused, but every hole is re-evaluated each frame).
```js
`The current time is ${new Date(now).toLocaleTimeString("en-GB")}.`
```

### `width`
Per block: the content width (px) of **this block's own `<slot>`** (≈ its container), via
ResizeObserver. The slot is switched to `display:block` if it was `display: contents`.
- No initial value: the block waits for the first non-zero measurement; zero and unchanged widths
  are skipped. Any block reading `width` rebuilds on resize.
- Not the window width (unlike Observable Framework). Window width: `events(window, 'resize', () => window.innerWidth, window.innerWidth)`.
```js
const chart = display(<canvas width={width} height={Math.round(width / 6)}/>);
```

### `invalidator`
```ts
invalidator.add(predicate: (value) => boolean, handler: (value) => void): this
```
Register once, in a `{ }` block so it is a statement with no outputs:
```html
<script type="module" is="reactive">
    {invalidator.add(value => value instanceof AudioNode, value => value.disconnect());}
</script>
```

## 3. How values flow between blocks

A block function's return (the `{out1, out2}` object) is split into one node per output name;
each output value is normalised by `toAsyncIterable`, in this priority order:

1. AsyncIterable (async generator objects, `Mutable`, `Raw`, `view`/`input`/`events`/`observe`
   results, ReadableStream) → iterated; each value re-runs dependents.
2. Iterator (sync generator objects, `arr.values()`) → iterated.
3. Async generator **function** with zero params → called and iterated.
4. Generator **function** with zero params → called and iterated
   (`const i = function* () { for (let i = 0; ; ++i) yield i; }` → dependents see the frame count).
5. Anything else → one value; **Promises are awaited** (rejection = error, see §6).

So: arrays/Sets/Maps/strings/DOM nodes/functions-with-params pass through as single values. A
Promise resolving to a generator is *not* iterated. An object with a `next()` method is mistaken
for an iterator — don't export a top-level `function next()`.

Top-level `await` makes the block async; dependents run after it resolves. There is no need (and
no way) to `await` another block's value — it already arrives resolved.

## 4. Scheduling

- After every yielded value a node awaits the throttle: `requestAnimationFrame` in browsers
  (`setImmediate` in Bun/Node). Max one emission per node per frame; intermediate values dropped.
  Updates pause in background tabs.
- Backpressure is "fastest/latest wins": slow consumers skip intermediate values. If every value
  matters (e.g. accumulating events), accumulate inside one generator/`observe` or in a mutable's
  `update`, not by relying on dependents seeing each value.
- A block re-runs on every input emission even if the value is identical.
- Synchronous diamonds (`m → x`, `m → y`, `(x, y) → z`) settle in the same microtask turn, so `z`
  sees consistent `x`/`y` (`AsyncIteratorRacer`). If one branch is async (await/fetch/promise), `z`
  can briefly run with the new value from the fast branch and the old value from the slow one;
  derive both in one block if that matters.
- Interruption is best-effort: after an input changes, one stale value from the previous
  run/generator may still arrive (the repo's own test for this fails on Bun 1.4.2). For async
  results, carry the query in the value (`{query, items}`) and check it, or abort via
  `AbortController` so stale responses resolve to nothing.
- `graph.run()` iterates every sink; nothing runs unless something downstream pulls it — a block
  with no dependents is a sink and runs.

## 5. Invalidation (cleanup)

When a block's inputs change it re-runs; as each new output value is delivered, the **previous
value of that output** is invalidated (so the new AbortController/socket is created just before
the old one is aborted/closed). Default rules, first match wins:
- `null`/`undefined` → nothing
- `AbortController` → `.abort()`
- has `[Symbol.dispose]` → called
- has `[Symbol.asyncDispose]` → called (not awaited)
- generator objects (which have `Symbol.dispose`/`asyncDispose` in modern engines) → closed, so
  their `finally` runs. A zero-arg generator *function* output is **not** finalised — prefer
  generator objects or an explicit disposable.

```js
const controller = new AbortController();          // aborted when `query` changes
const results = fetch(`/api?q=${encodeURIComponent(query)}`, {signal: controller.signal})
    .then(r => r.json()).catch(e => e.name === 'AbortError' ? [] : [{error: e.message}]);
```
```js
const socket = Object.assign(new WebSocket(url), { [Symbol.dispose]() { this.close(); } });
```
- Only declared top-level outputs (the node values) are invalidated — a resource hidden in a `{}`
  block is never cleaned up.
- The final value is not invalidated at page teardown (only iterators are returned).
- No Observable-style `invalidation` promise; returning a function does nothing.

## 6. Errors

There is no error channel. A synchronous throw or rejected promise in a block causes an unhandled
rejection in the console and **that node and everything downstream stop updating**. Generator
errors after a yield may be swallowed. Transform-time parse errors are rendered as text in the
block's slot. So: `try/catch` inside blocks, `.catch()` on fetches, and render an error value:
```js
const user = fetch(`/api/users/${id}`).then(r => r.ok ? r.json() : Promise.reject(new Error(r.statusText)))
    .catch(error => ({error: error.message}));
```
```js
user.error ? <p class="error">{user.error}</p> : <h2>{user.name}</h2>
```

## 7. Outside HTML: Graph / BaseGraph

```ts
import {Graph} from "@bodar/dataflow/Graph.ts";      // no root "@bodar/dataflow" export exists
const graph = new Graph();
graph.define('name', () => 'Dan');
graph.define('time', function* () { while (true) yield new Date().toLocaleTimeString("en-GB"); });
const {reactive} = graph.define('reactive', (name: string, time: string) => `Hello ${name}, the time is ${time}`);
for await (const value of reactive) console.log(value);
```
- `Graph.define(fun)`, `define(key, fun)`, `define(key, inputs, outputs, fun)`. Inputs are parsed
  from parameter names (no destructured/default params); outputs from a returned object literal.
- `BaseGraph.define(key, inputs, outputs, fun)` takes explicit arrays and binds dependencies **at
  definition time** — define producers before consumers (order-independence is the transformer's
  job, not the graph's). `graph.run()` pulls all sinks.

## 8. Gotchas (beyond those in SKILL.md)
1. `undefined` terminates `observe`/`events`/`input`/`Mutable` streams — permanently and silently
   (every later update is lost).
2. No initial value ⇒ dependents wait (`events` without initial, `width`, file inputs).
3. In-place mutation without a set (`m.value.push(x)`) notifies nothing.
4. Bare globals are captured once as a *binding* (`innerWidth`, `location` are snapshots), but
   property reads on a captured object stay live: `document.activeElement`, `window.innerWidth`
   inside a callback. Use `events`/`observe` when a block must *re-run* on change.
5. `events` (plural), not `event`. No `Generators.*`, `visibility`, `invalidation`, `resize()`.
