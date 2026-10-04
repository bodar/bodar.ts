---
name: dataflow
description: How to build, edit, debug, test and deploy reactive HTML pages with @bodar/dataflow, the minimal Observable-inspired literate/reactive system that turns `<script type="module" is="reactive">` blocks into a spreadsheet-like dependency graph, with JSX compiled to real DOM by @bodar/jsx2dom (no React). Use this skill whenever the task touches @bodar/dataflow or @bodar/jsx2dom, `is="reactive"` / `data-reactive` scripts, `is="reactive-island"`, view()/display()/mutable()/events()/observe()/width/now, HTMLTransformer, DOMTransformer, ReactiveHandler, or renderAndExecute. Also use it for Observable/ObservableHQ-style reactive HTML, for porting or rewriting React, Preact, Svelte, Vue or Solid components or apps to dataflow, for making static or server-rendered HTML reactive without a build step, and for deploying reactivity as an HTTP intercept at the edge (Cloudflare, Bun, service worker). Use it even when the user only says "dataflow", "reactive block" or "jsx2dom" in passing.
---

# @bodar/dataflow

Dataflow makes plain HTML reactive. You write ordinary HTML and put JavaScript (+ JSX) in
`<script type="module" is="reactive">` blocks **where their output should appear**. A transformer
(run at build time, or per request as an HTTP intercept) parses each block, works out what it
declares and what it references, topologically sorts the blocks into a DAG and emits a tiny
runtime script (~5 KB gzipped incl. JSX). It is Observable Framework's reactivity, but grounded in
HTML instead of Markdown, and designed to be as small as possible.

Source of truth (if available): `packages/dataflow/src`, `packages/jsx2dom/src`, docs in
`packages/dataflow/docs/*.html`, examples in `packages/dataflow/docs/examples/*.html` in the
`bodar/bodar.ts` monorepo. Trust source over README/CLAUDE.md prose, which has stale bits
(`event()` is now `events()`, there is no root `@bodar/dataflow` export, never import `view`).

## Mental model: a spreadsheet of blocks

- **Each reactive block is a cell (graph node).** Its **top-level declarations** (`const`, `let`,
  `var`, `function`, `class`, static `import` names) are its **outputs**. Every **free identifier**
  it references is an **input**.
- **Order on the page does not matter.** Blocks are sorted by dependency; a label block can use a
  value declared further down. Page position only decides *where output renders*.
- **When an input changes, the block re-runs from scratch** (no equality check, no diffing of
  logic) and its outputs flow to dependents. Think "cell recalculates", not "component re-renders".
- **Values are unwrapped across blocks, never within one.** If a block declares a Promise, other
  blocks see the resolved value. If it declares a generator / async iterable / `mutable` / `view`,
  other blocks see the *latest yielded value* and re-run on each new one. Inside the declaring
  block you still hold the promise/iterator/Mutable itself.
- **A block only runs once all its inputs have a first value.** A source with no initial value
  (e.g. `events(el, 'click', f)` before the first click) holds back everything downstream.
- **Everything is throttled to animation frames** (`requestAnimationFrame`): at most one emission
  per node per frame, latest wins. An infinite `while (true) yield` generator is safe and runs at
  ~60 fps. Don't write rAF/setInterval loops.
- **Invalidation = cleanup.** When a block re-runs, the previous value of each output is disposed
  as its new value is delivered (new resource created first, then the old one cleaned up):
  `AbortController` → `.abort()`, `[Symbol.dispose]` / `[Symbol.asyncDispose]` → called,
  generator objects → closed. Custom rules via the `invalidator` global. There is no
  `invalidation` promise and no React-style "return a cleanup function".
- **Unknown identifiers are globals**, read once from `globalThis` (`document`, `fetch`, `Math`…).
  The binding is a snapshot, not reactive (property reads like `document.activeElement` stay
  live), and a typo is `undefined`, not a ReferenceError.
- **One shared scope per page** (the `<body>`). All top-level names across all blocks share one
  namespace — duplicate names silently last-win. `is="reactive-island"` elements get their own
  isolated scope + runtime (great for HTML fragments / HTMX swaps).
- **Literate pages.** Prose is plain HTML around the blocks; add `data-echo` to a block to print
  its source above its output (`data-echo="html"` echoes the whole `<script>` tag).

## Be conscious that the reactive scope is global

Every top-level declaration in a block is a page-wide name: a graph output that any block can see
and depend on, sharing one namespace (each island has its own). So a top-level name is a public,
reactive value, not a local variable. Declare things there when they are meant to be shared: state,
inputs, actions, or values other blocks use. A value used in one place usually reads best inline
at that place. When a block genuinely needs locals, for example a helper its handlers close over
or a value used several times, keep them local with a `{ ... }` scope plus `display(...)`, or make
them top-level deliberately if sharing them is fine. A block, `display()` call or `{}` scope that
doesn't change behaviour is just indirection. This is about how the reactive code is structured,
not a line-count goal. It says nothing about styling, markup or presentation, which follow the
task as usual.

- **Prefer blocks that evaluate to their elements**: a single JSX tree or template literal
  displays itself. Use `display()` sparingly.
- **Inline derived values into the expression** that uses them (`.map`, ternaries, arithmetic in
  attributes) rather than adding page-wide names nobody else needs.
- **One region, one expression.** A row of buttons, or a list plus its count, is one JSX tree,
  not several `display()` calls.
- **Reach for `display()` when the block does more than produce elements**: it keeps a handle
  (`const canvas = display(<canvas/>)`), declares outputs, needs locals, or runs statements first.
- **Split blocks only when it changes behaviour**: inputs must live in blocks that don't depend on
  changing state (or they get recreated); fast sources like `now` shouldn't re-run heavy blocks;
  a value used by several blocks gets its own name. Otherwise, fewer blocks.

```html
<!-- ✗ indirection: scope, single-use names, display() -->
<script type="module" is="reactive">
{
    const w = 600, h = 200, barW = w / balances.length;
    const y = b => h - b / amount * h;
    display(<svg viewBox={`0 0 ${w} ${h}`}>{balances.map((b, i) =>
        <rect x={i * barW} y={y(b)} width={barW - 2} height={h - y(b)}/>)}</svg>);
}
</script>
<!-- ✓ one expression -->
<script type="module" is="reactive">
<svg viewBox={`0 0 ${years * 10} 100`} preserveAspectRatio="none">
    {balances.map((b, i) => <rect x={i * 10} y={100 - b / amount * 100} width="8" height={b / amount * 100}/>)}
</svg>
</script>
```

## Essential syntax rules

```html
<script type="module" is="reactive">const name = view(<input value="World"/>);</script>
<p><script type="module" is="reactive">`Hello, ${name}!`</script></p>
```

1. **Implicit display only for a single expression.** A block that is exactly one expression
   statement (template literal, JSX, ternary, arithmetic…) renders its value in place. Any block
   with a declaration or multiple statements renders nothing unless it calls `display(...)` /
   `view(...)`. `const a = 1; a + 1` shows nothing. A lone side-effect like `el.focus()` *will*
   be wrapped in `display(...)` — wrap such code in `{ ... }`.
2. **`{ ... }` makes locals private.** A bare block statement keeps `ctx`, temp vars etc. out of the
   shared namespace (and is not displayed). Use it for draw/effect blocks.
3. **Only plain identifier declarations are outputs.** `const {a, b} = obj` and `const [x, y] = arr`
   export nothing. Write `const a = obj.a;` or export the object.
4. **Inside one block, declare before use.** `const f = () => g(); const g = ...;` in the same
   block is a self-cycle and fails the transform ("Circular dependency detected"). Reorder or
   split; cross-block order is free. Real cycles between blocks also fail the whole transform.
5. **Never `import` the runtime API or `export` anything.** `display`, `view`, `input`, `events`,
   `observe`, `mutable`, `raw`, `now`, `width`, `jsx`, `invalidator` are injected. Importing them
   breaks the block; `export` produces invalid code. Don't reuse these names for your own variables.
6. **Static `import` of libraries is fine** (`import * as Plot from "@observablehq/plot";`) — it
   becomes a dynamic `import()`, makes the block async, and the imported names become shared
   outputs. Put imports in their own block (an import + one expression doesn't auto-display),
   don't use `{x as y}` renames, don't mix default + named in one import, one import per source.
   Bare specifiers need an import map entry (or use `https://esm.run/...` URLs).
7. **Top-level `await` and `for await` are allowed** and make the block async.
8. **`display()` renders only `Node | string | number`.** Arrays, booleans, null, objects and
   Promises silently render nothing — wrap in JSX or `String(...)`. Multiple `display()` calls in
   one run render in order; the next run (or a later async batch) *replaces* them.
9. **No TypeScript in reactive blocks** (see Limitations). Plain modern JS + JSX only.

## Runtime API cheat-sheet (all implicit — no imports)

| Name | Use |
|---|---|
| `display(x)` | Render `x` into this block's slot; returns `x` (`const c = display(<canvas/>)`). |
| `view(el)` | Display an input element and return its live value: `const n = view(<input type="range"/>)` → other blocks see a number. |
| `input(el, event?, el => value)` | Like `view` but doesn't display — place the element yourself. Extractor gets the **element**. |
| `events(target, type, ev => value, initial?)` | Any `EventTarget` → stream. Plural `events`. Returning `undefined` ends the stream. |
| `observe(notify => { …; return () => cleanup }, initial?)` | Arbitrary push source with cleanup (cleanup must take no params). |
| `mutable(init)` | Writable state. Declaring block: `.value`, `.value = v`, `.update(f)`. Other blocks: plain current value. |
| `raw(x)` | Pass a generator function / iterable through un-iterated (doesn't stop Promise awaiting). |
| `now` | Current `Date.now()` number, updates every frame. Referencing it re-runs the block per frame. |
| `width` | Width (px) of *this block's slot/container* via ResizeObserver (not window width). |
| `invalidator.add(pred, handler)` | Custom cleanup rule, e.g. `value instanceof AudioNode → value.disconnect()`. |

`view()`/`input()` value by element: range/number → number, checkbox → boolean (click), date →
Date, file → File (change), select-multiple → string[], everything else (text, color, select,
textarea, radio) → string. Full, precise semantics: **[references/api.md](references/api.md)**.

## JSX without React

JSX in blocks is compiled at transform time to `jsx.createElement(tag, attrs, [children])`, where
`jsx` is a `JSX2DOM` instance that creates **real DOM nodes** immediately. Nothing to import, no
React, no Babel/tsconfig step. (The repo's root tsconfig `"jsx": "react", "jsxFactory":
"jsx.createElement", "jsxFragmentFactory": "null"` exists only for `.tsx` source files that make
their own `const jsx = new JSX2DOM()`.) A JSX expression's value *is* the element — call
`.getContext('2d')` on it, pass it to `view()`, append it anywhere.

**JSX is optional.** A block can produce any string, number or Node: template literals,
`document.createElement(...)`, or a node returned by a chart library (`Plot.plot(...)`,
`vg.vconcat(...)`). JSX is just a convenience compiled to jsx2dom.

Top silent failures (full React/Svelte/Vue → jsx2dom table:
**[references/jsx2dom.md](references/jsx2dom.md)** §7):

| Don't (React) | Do (jsx2dom) | Why |
|---|---|---|
| `onClick`, `className`, `htmlFor`, SVG `strokeWidth` | `onclick`, `class`, `for`, `stroke-width` | Names are verbatim: `onClick` listens for `"Click"`; attributes via `setAttribute`. |
| `{cond && <X/>}`, `{maybeNull}` | `{cond ? <X/> : ''}` | `false`/`null`/`undefined` render as the *text* "false"/"null". |
| `<MyComp prop={1}/>` | `{myComp({prop: 1})}` | No function components; capitalised tags crash at runtime. |
| `value={v}` + `onChange` (controlled) | `const v = view(<input value="init"/>)` | `value`/`checked` set the *initial* attribute only. |
| `{/* comment */}` in JSX | JS comments outside JSX | Breaks the transform. |

Also: no automatic `px` in `style` objects; booleans set only for exactly `true`; JSX
whitespace/newlines are kept verbatim; `<>…</>` → DocumentFragment.

### How re-rendering works (and why it matters)

A re-run produces brand-new DOM. The slot keeps an old top-level child only if `isEqualNode` to the
new one; otherwise it is replaced wholesale. Any element with an `on*` handler gets a unique
`data-key`, so subtrees with handlers are **always** replaced. General rule: **any live DOM state
inside a re-running block is reset** — focus, caret, typed text, inner scroll position,
`<details open>`, media playback, and CSS transitions/animations never play (the element is new,
not mutated). Consequences:

- Keep inputs the user types into in blocks that **do not depend on changing state**
  (`const q = view(<input/>)` in its own block; forms that read their fields on submit).
- Put derived output (lists, counts, charts) in separate blocks downstream.
- A `view()` block that re-runs and yields an `isEqualNode`-identical element keeps the *old*
  element on screen while listening to the new detached one — keep `view` blocks dependency-free.
- For transitions, scroll containers, maps/editors: render the element once (static HTML or a
  dependency-free block) and mutate it (`classList`, `style`, `hidden`, library methods) from a
  `{}` effect block. See porting.md §4.

### Where output lands

Block output is rendered inside a `<slot name=KEY>` left where the script was (`display:
contents` by default; `width` switches it to `display:block`). So:
- Child combinators and structural selectors (`ul > li`, `.grid > .card`, `:first-child`,
  `:nth-child`) don't match block output — the slot sits in between. Use descendant selectors or
  style the element the block renders.
- Don't put a block directly inside `<table>`/`<tbody>`/`<tr>` or `<select>`: the browser's HTML
  parser moves (foster-parents) a `<slot>` out of table context and may drop or relocate it inside
  a select. Make one block render the whole `<table>`/`<select>` with rows/options via `.map`.
  (Spec-based; not exercised by the repo's tests.)
- The slot is **empty in the served HTML**: block output is client-rendered only (no SSR or
  hydration, nothing for crawlers/no-JS). Anything that must be in the initial HTML belongs in
  the static/server-generated markup around the blocks — the HTTP intercept lets the server emit
  that HTML and the blocks enhance it.

## Modelling: reactive flows, not components

Don't build a component tree with local state. Slice the app into flows:

1. **State + actions block**: `const todos = mutable([...])` plus `addTodo`, `deleteTodo`… closures
   in the same block (only the declaring block can write `.value`; other blocks call the actions).
   Keep it free of reactive inputs, or it re-runs and resets the state.
2. **Input blocks**: `view(...)` / uncontrolled forms that call actions. Rendered once.
3. **Derived values** — this *is* useMemo / `$:` / computed. Usually just inline them in the view
   expression (`{todos.filter(filter).map(...)}`); give them a named block only when shared.
4. **View blocks**: single JSX expressions that read state and inputs.
5. **Effect blocks**: `{ ... }` blocks that draw to canvas, write to external APIs, or push into a
   mutable (e.g. on `now`). Resources they create are top-level outputs so invalidation cleans them.

The most common porting mistake is state and the UI reading it in one block — the declaring block
never re-runs on its own mutable, and inside it `count` is the `Mutable`, not the number:
```js
// ✗ one block: never updates
const count = mutable(0); display(<button onclick={() => count.value++}>{count.value}</button>);
// ✓ block 1                                   ✓ block 2 (re-runs on change)
const count = mutable(0);                      <button onclick={increment}>{count}</button>
const increment = () => count.value++;
```

Prefer `view()` over `mutable` + handlers; prefer external sources of truth (`events(audioCtx,
'statechange', …)`) over mirroring them in mutables. Split blocks where it changes what re-runs,
not for tidiness (see "Be conscious that the reactive scope is global").
Prefix names per section on big pages (`fillRectX`, `strokeRectX`) since the namespace is shared.

## Known limitations (be upfront about them)

- **No TypeScript in reactive blocks yet.** Blocks are parsed with acorn (+ JSX); a type
  annotation is a parse error displayed in the slot. Support is planned once the TypeScript 7.1
  Go-based compiler API lands. Don't fake it (no stripping hacks, no `typeTransformers` "ts" shim);
  write plain JS, and use JSDoc comments if types help readability. Server/build code around
  dataflow (`.ts` files) is normal TypeScript, and blocks may import typed logic from ordinary
  `.ts` modules compiled to JS (porting.md §1 step 8) — that adds no TS syntax to blocks.
- **Block output is client-rendered only** (see "Where output lands").
- **Only structure knowable at transform time becomes graph nodes.** The graph is built from the
  `<script is="reactive">` tags present in the HTML when it is transformed. You can't create
  blocks at runtime; reactive scripts injected later by client JS are inert. Dynamic *data*
  (lists, conditionals, variable counts) is rendered *inside* a block (`items.map(...)`). Dynamic
  *structure* means: render it in a block, transform it server-side per request (the HTTP
  intercept can transform server-generated HTML), or load an island fragment from an endpoint
  that is itself transformed.
- No error propagation: a throw / rejected promise in a block silently freezes that block and its
  dependents (console shows an unhandled rejection). Catch errors inside the block and display a
  fallback.
- Not Observable: no `Generators.*`, `visibility()`, `invalidation`, `html\`\``, Markdown pages.

## Minimal complete page

```html
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Counter</title></head>
<body>
<h1>Hello <script type="module" is="reactive">name</script></h1>

<!-- input: rendered once, never re-created -->
<script type="module" is="reactive">const name = view(<input value="World"/>);</script>

<!-- state + actions -->
<script type="module" is="reactive">
    const count = mutable(0);
    const increment = () => count.value++;
    const reset = () => count.value = 0;
</script>

<!-- static buttons: no changing inputs, so rendered once -->
<script type="module" is="reactive">
    <p><button onclick={increment}>+1</button> <button onclick={reset}>Reset</button></p>
</script>

<!-- derived view: re-runs whenever count changes -->
<script type="module" is="reactive">
    <p>Clicked {count} time{count === 1 ? '' : 's'}</p>
</script>

<!-- clock: `now` re-runs this tiny block every frame, so keep handlers out of it -->
<p>Time: <script type="module" is="reactive">new Date(now).toLocaleTimeString()</script></p>
</body>
</html>
```

Serve it transformed (Bun; Cloudflare Workers is the same with `fetch` as upstream):

```ts
import {ReactiveHandler} from "@bodar/dataflow/http/ReactiveHandler.ts";
import {HTMLTransformer} from "@bodar/dataflow/html/HTMLTransformer.ts";

const importMap = {imports: {"@bodar/dataflow/runtime.ts": "https://dataflow.bodar.com/runtime.js"}};
Bun.serve({
    port: 3000,
    fetch: ReactiveHandler(() => new HTMLTransformer({rewriter: new HTMLRewriter(), importMap}),
        async req => new Response(Bun.file(`./public${new URL(req.url).pathname.replace(/\/$/, '/index.html')}`)))
});
```

The transformer factory must create a fresh `HTMLTransformer` + `HTMLRewriter` per response, and the
upstream response must be `200` with an `html` content-type. In this repo, `./run demo` serves the
docs at http://localhost:3000/.

## Reference files — read when relevant

- **[references/api.md](references/api.md)** — every runtime function precisely: signatures,
  value types, same-block vs cross-block behaviour, termination, cleanup, invalidation, value
  normalisation (promises/generators/iterables), throttling, errors, glitches. Read when using
  anything beyond `view`/`display`/`mutable` basics, or when something "doesn't update".
- **[references/transform-rules.md](references/transform-rules.md)** — what the transformer does
  to a block: inputs/outputs analysis, implicit display rules, slots, imports rewriting, async,
  ids, scopes/islands, topological sort, cycles, emitted runtime code. Read when debugging "nothing
  renders", "Circular dependency", "undefined value", or import problems.
- **[references/jsx2dom.md](references/jsx2dom.md)** — JSX compilation and the JSX2DOM runtime:
  attributes, events, styles, booleans, SVG namespaces, children, fragments, slot reconciliation,
  using JSX2DOM in `.tsx` files. Read when writing non-trivial markup, SVG, or porting JSX.
- **[references/patterns.md](references/patterns.md)** — idioms from the examples with snippets:
  forms, CRUD lists, filters, fetch + abort, async init, animation with `now`/generators, canvas,
  SVG, Web Audio, charts (Observable Plot), cross-filter (Mosaic), timers, websockets. Read before
  building any real page.
- **[references/porting.md](references/porting.md)** — systematic React / Svelte / Vue → dataflow
  translation (state, effects, memo, props, context, stores, lifecycle, conditionals, lists, refs,
  forms, routing, data fetching, transitions, imperative widgets, Web Components, typed .ts
  modules) with side-by-side examples, and what to do when structure isn't
  transform-time knowable. Read for any migration or "how would I do X from React" question.
- **[references/deployment.md](references/deployment.md)** — HTTP intercept (`ReactiveHandler`)
  for Bun/Cloudflare/Deno/Node/service worker, static build, import maps vs `BunBundler`, islands
  with HTMX, browser `DOMTransformer`, and testing pages with `renderAndExecute` + `Idle`. Read when
  serving, building, or testing.

Further reading in the repo: `packages/dataflow/docs/{index,reactivity,inputs,islands,setup}.html`
and `packages/dataflow/docs/examples/{todo,comments,memory,canvas-tutorial,svg-tutorial,audio-tutorial,cross-filter-flights}.html`.
