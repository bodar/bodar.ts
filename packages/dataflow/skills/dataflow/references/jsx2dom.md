# JSX in dataflow (@bodar/jsx2dom)

Source: `packages/jsx2dom/src/JSX2DOM.ts`, `PositionalJSX.ts`,
`boolean-attributes.ts`, `svg-elements.ts`, `types.d.ts`; dataflow's compiler `packages/dataflow/src/jsx-transform/transformer.ts`;
`src/html/SlotRenderer.ts`.

## Contents
1. Two pipelines, one convention
2. What JSX compiles to
3. JSX2DOM.createElement rules (attributes, events, style, booleans, children)
4. SVG
5. Re-runs: positional JSX and slots
6. Unsupported syntax
7. React → jsx2dom table

---

## 1. Two pipelines, one convention

**Inside reactive blocks (HTML pages):** the dataflow transformer compiles JSX itself at transform
time. You import nothing, configure nothing; a block that uses JSX is registered as
`new PositionalJSX(_runtime_).wrap((jsx, ...inputs) => {…})` — its own `PositionalJSX`, kept across
runs and passed in as `jsx`. Don't declare your own `jsx`, don't import React/`h`/JSX2DOM in blocks, and don't add a
Babel/esbuild/tsconfig JSX step for pages.

**In `.tsx` source files** (library code, tests, server-side rendering): the TypeScript compiler's
classic transform does it, configured in tsconfig:
```json5
{ "compilerOptions": { "jsx": "react", "jsxFactory": "jsx.createElement", "jsxFragmentFactory": "null" } }
```
You need a variable literally named `jsx` in scope:
```tsx
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();                       // browser globals
document.body.appendChild(<div class="firstname" title={`Hello ${name}`}>{name}</div>);
```
```tsx
import {parseHTML} from "linkedom";
const html = parseHTML('<html><body></body></html>');
const jsx = new JSX2DOM(html);                   // edge/server/tests: no global pollution
html.document.body.appendChild(<div class="Foo"><input/>Test</div>);
```
This is why a model may *think* JSX needs React — it doesn't. `JSX.Element` is typed as
`HTMLElement | SVGElement`, and typed props use HTML attribute names (`class`, `for`, `tabindex`,
lowercase `onclick`); `className`/`onClick` are type errors in `.tsx`. Reactive blocks are not
type-checked at all.

## 2. What JSX compiles to

In blocks (`site` is the JSX's source offset, used as its identity; children are thunks):

| JSX | Output |
|---|---|
| `<div />` | `jsx.element(0, "div", null)` |
| `<Foo />` / `<A.B />` | `jsx.element(0, Foo, null)` — `Foo` must hold a tag name string (no components) |
| `<div id="x" />` / `<div id={x} />` | `jsx.element(0, "div", {"id": "x"})` / `{"id": x}` |
| `<input disabled />` | `{"disabled": true}` |
| `<div a="1" {...p} b={2} />` | `{"a": "1", ...p, "b": 2}` (order kept, later wins) |
| `<div>a{b}<i/></div>` | `jsx.element(0, "div", null, "a", () => b, () => jsx.element(9, "i", null))` |
| `<div>{await x}</div>` | `jsx.element(0, "div", null, [await x])` — can't be deferred, so eager |
| `<>…</>` | `jsx.element(0, null, null, …)` → an array of its nodes |
| `{/* comment */}` | dropped |

In `.tsx` files (TypeScript's classic transform): `jsx.createElement(tag, attrs, ...children)`;
`<>…</>` → `jsx.createElement(null, null, …)` → DocumentFragment.

- Capitalised first letter → identifier, otherwise string tag.
- Attribute names are passed **verbatim** (no `className`→`class`, no `onClick` lowering).
- **Whitespace is not trimmed** (unlike React/Babel): newlines/indentation between tags become text
  nodes. Matters for `<pre>`, inline-block gaps, `firstChild`, `childNodes` indexing.
- HTML entities in JSX text are decoded (`&nbsp;`, `&amp;`).
- Nested JSX anywhere (attributes, `.map` callbacks, ternaries) is converted.

## 3. JSX2DOM.createElement rules

```ts
class JSX2DOM {
  constructor(deps: {document: Document, Node: typeof Node, onEventListener?} = globalThis)
  createElement(name: null, attributes: null, ...contents: Content[]): DocumentFragment
  createElement(name: string, attributes: Attributes | null, ...contents: Content[]): HTMLElement | SVGElement
}
type Content = string | number | Node | Content[];
// @bodar/jsx2dom/PositionalJSX.ts (what blocks use; see §5)
class PositionalJSX extends JSX2DOM {
  wrap(fun: (jsx, ...args) => R): (...args) => R  // each call is a run, claiming until fun returns or its promise settles
  element(site, tag, attributes, ...children): Node | Node[]   // createElement is inherited: always fresh
}
place(parent, owned, nodes)                   // places nodes in order, moving only misplaced ones
flatten(value, Node)                          // arrays flattened, fragments as nodes, null/undefined/false dropped
stableListener(element, eventName, listener?) // onEventListener hook: one dispatcher per element+event calling its current handler (none: cleared)
```

These are `createElement`'s rules. `element()` in blocks writes the same way, with differences:
`key` is consumed; attributes are written after the children and only when their JSX value
changed (a removed one is removed); `value`/`checked`/`selected` are also set as properties (so
`<select value={v}>` and `<textarea value={v}>` work); `style` objects are diffed per key;
`null`/`undefined`/`false` children render nothing; a fragment is an array of nodes.

Attributes, per key, in this order:
1. `null` / `undefined` → skipped (use this to omit an attribute conditionally).
2. `on*` with a **function** → `addEventListener(key.substring(2), fn)`. Event name is verbatim:
   `onclick` → `click`, `onClick` → `Click` (never fires). Custom events: `onmy-event`. A
   non-function `on*` value becomes an inline attribute.
3. `style`: object → each prop `Reflect.set(el.style, prop, String(v))` (camelCase OK, **no `px`
   added**, CSS custom properties need the string form); string → `el.style.cssText = value`.
   ```jsx
   <div style={{fontSize: '16px', color}}/>   <div style={`--hue: ${h}; color: red`}/>
   ```
4. HTML boolean attributes (`allowfullscreen async autofocus autoplay checked controls default
   defer disabled formnovalidate hidden inert ismap itemscope loop multiple muted nomodule
   novalidate open playsinline readonly required reversed selected`) → set to `''` only when the
   value is exactly `true`; anything else omits it. camelCase variants (`readOnly`, `autoFocus`)
   are not in the set and get stringified — `readOnly={false}` yields `readonly="false"`, which
   **is** readonly. Use lowercase names.
5. Everything else → `setAttribute(key, String(value))`. Never property assignment:
   - `value`, `checked` on inputs set the **initial/default** state only (blocks: see above).
   - `<select value={v}>` does nothing here; mark `<option selected={o === v}>` instead.
   - `<textarea value={v}>` sets an attribute; write `<textarea>{v}</textarea>`.
   - `aria-hidden={false}` → `"false"`; `data-id={42}` → `"42"`.
   - `innerHTML`, `ref`, `key`, `dangerouslySetInnerHTML`, `className`, `htmlFor` become literal
     (useless) attributes.

Children:
- `Node` (elements, text, fragments, a chart library's `<svg>`, a canvas) → appended (moved if
  already in the DOM).
- Arrays (any depth) → flattened. `{items.map(i => <li>{i}</li>)}`; empty array renders nothing.
- **Everything else → `String(x)` text**: `false` → "false", `null` → "null", `undefined` →
  "undefined", `0` → "0", objects → "[object Object]", Promise → "[object Promise]".
  In blocks `false`/`null`/`undefined` render nothing; `0` still renders "0".
- Strings are text nodes (safe). For trusted HTML: `const d = <div/>; d.innerHTML = html;`.

The value of a JSX expression *is* the DOM node: store it, call methods on it, attach listeners,
pass it to `view()`/`input()`, append it elsewhere.

## 4. SVG

Namespace is chosen purely by **tag name** (`svg circle ellipse line path polygon polyline rect g
defs symbol use clipPath mask marker pattern text tspan textPath linearGradient radialGradient stop
filter fe* image foreignObject switch title desc metadata view animate animateMotion
animateTransform mpath set`) → `createElementNS(svgNS, name)`.
- Attributes are verbatim: use real SVG names — kebab-case presentation attributes
  (`stroke-width`, `stroke-linecap`, `stroke-dasharray`, `font-size`, `text-anchor`,
  `fill-opacity`), camelCase only where SVG itself is camelCase (`viewBox`, `startOffset`,
  `preserveAspectRatio`, `stdDeviation`). (The repo's svg-tutorial uses `strokeWidth` — it has no
  effect; don't copy that.)
- Use `href`, not `xlink:href` (namespaced attributes are mangled by the compiler).
- `<a>`, `<style>`, `<script>` inside SVG are created as HTML elements. `<title>`, `<image>`,
  `<text>` etc. are always SVG-namespaced, even in HTML context — don't create a document
  `<title>` via JSX.
```jsx
<svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
    <circle cx={x} cy={y} r="10" fill={color} stroke="black" stroke-width={2}/>
    <path d={path} fill="none" stroke="#888" stroke-dasharray="4 2"/>
</svg>
```

## 5. Re-runs: positional JSX and slots

There is no virtual DOM and no hooks. A block's JSX **hands back last run's element made at the
same place** and writes only what its JSX changed since last run (JSX-vs-last-JSX, never
JSX-vs-DOM, so whatever the user or code changed survives unless the JSX changes it too).

The same place = the call site, in the current parent's child hole (or the run, at top level),
plus `key`, or without a key the order among uses of that site in that hole. Children are thunks,
so a parent is claimed before its children; that is what scopes identity to the hole.

```
run 1: <ul>{xs.map(x => <li key={x.id}>{x.n}</li>)}</ul>   → ul, li#a li#b li#c
run 2: same JSX, xs reordered c,a,b                        → same ul, same lis, li#c moved; texts patched
```

- Text nodes in a hole are reused by index; their `.data` is written only when the JSX text changed.
- Handlers are stable listeners (`stableListener`): a new closure is a pointer swap; a removed
  handler stops firing.
- Keyed claims are matched per parent across all its holes, so keys must be unique per parent
  (prefix them per list when two lists share one parent); a duplicate warns once and the second
  gets fresh DOM every run. Unkeyed claims are by order within a hole.
- A different call site in a hole is a miss: only that hole rebuilds (same tag or not).
- An element with no JSX children doesn't own its children. One with JSX children owns only the
  nodes it placed: it removes those it no longer wants and leaves other children alone. Code that
  replaces its children (`textContent =`, `replaceChildren`) ends up beside the JSX's own nodes
  (`<span>{t}</span>`, then `s.textContent = 'edited'`, reads `editedt` after the next run).
- Elements are reused, so imperative setup in a re-running block (`addEventListener`, a
  `ResizeObserver`, a library init) repeats on the same element each run. Use `on*` attributes, do
  the setup in a block that doesn't re-run, or undo it (an `AbortController` output, an `observe`
  cleanup).
- A `Node` value in a hole (another block's element, a held canvas, a library's `<svg>`) is placed
  as is, never merged into. Strings/numbers are text.
- Moves use `moveBefore` where the browser has it (keeps focus, iframes and animations), else
  `insertBefore`; only misplaced nodes move.
- `jsx.createElement` (e.g. `.tsx` helpers compiled by tsc/Bun and given the block's `jsx`) always builds
  fresh DOM. To make module helpers positional too, compile their JSX with
  `transformModuleJSX(js, id)` (`@bodar/dataflow/jsx-transform/module.ts`, after stripping TypeScript with
  `jsx: preserve`, e.g. in a Bun plugin): sites become `"<id>@<offset>"`, so modules never share one.
- Change the `key` to get fresh DOM on purpose (reset scroll, replay a mount animation).
- A run lasts until the block's function returns or its promise settles. JSX evaluated outside its
  block's current run — a handler or timer after the run, a generator resumed later, a helper defined
  in another block, a run superseded by a newer one — builds fresh DOM and is remembered nowhere.
- A run that throws keeps what it already patched and claimed; anything it didn't reach is
  rebuilt next run (there is no rollback). An async run superseded before it finished hands its
  claims on, so the next run still reuses them.
- `<select value>` is re-applied every run (its options can change under an unchanged value).

The slot (`<slot name=KEY>`, `display: contents` by default) stays in the DOM as the parent of
the output — child combinators/structural pseudo-classes see the slot, not your nodes. A
`display` flush places the batch in the slot the same way: the same node is kept (moved only if
misplaced), others are removed; arrays are flattened. A node built fresh each run (not by the
block's JSX) replaces the old one.

## 6. Unsupported syntax (shows an error in the slot, or fails at runtime)

- Spread children `{...xs}` → parse error; use `{xs}`.
- `xlink:href`, `<svg:rect/>` (namespaced names) → broken/error.
- JSX as an unbraced attribute value `<a b=<c/> />` → error (and an element attribute would only
  be stringified anyway).
- `<Foo/>` function components → runtime crash; call `{foo(props)}`.
- TypeScript syntax (`as`, `: T`, generics) in reactive blocks → parse error (not supported yet).

## 7. React → jsx2dom

| React | jsx2dom |
|---|---|
| `className="x"` / `htmlFor` | `class="x"` / `for` |
| `onClick`, `onChange`, `onInput`, `onSubmit`, `onKeyDown` | `onclick`, `onchange`, `oninput`, `onsubmit`, `onkeydown` |
| `onChange` on a text input (fires per keystroke in React) | `oninput` (`change` fires on commit/blur) |
| `style={{fontSize: 12}}` | `style={{fontSize: '12px'}}` / `style="font-size:12px"` |
| `tabIndex`, `readOnly`, `autoFocus`, `maxLength`, `colSpan` | `tabindex`, `readonly`, `autofocus`, `maxlength`, `colspan` |
| `{n && <X/>}` | `{n > 0 ? <X/> : ''}` (`{cond && <X/>}` is fine in blocks: `false` renders nothing) |
| `<Comp a={1}/>` | `{comp({a: 1})}` — plain function returning nodes |
| `key={id}` | the same: matches list rows (blocks only; consumed, not an attribute) |
| `ref={r}` / `useRef` | `const el = <canvas/>;` — the element itself |
| `dangerouslySetInnerHTML` | `el.innerHTML = trusted` |
| controlled `value`/`onChange` | `const v = view(<input value="init"/>)`; `value={v}` is written only when `v` changes |
| `<select value={v}>` | the same in blocks; in `.tsx`, `<option selected={o === v}>` |
| `<textarea value={v}/>` | the same in blocks; in `.tsx`, `<textarea>{v}</textarea>` |
| Svelte `class:active={x}` / Vue `:class="{active: x}"` | `class={x ? 'active' : ''}` |
| Svelte `on:click` / Vue `@click` | `onclick={f}` |
| Svelte `style:color={c}` / Vue `:style` | `style={{color: c}}` / `` style={`color: ${c}`} `` |
| Svelte `{@html x}` / Vue `v-html` | `el.innerHTML = x` on an element you hold |
| `import React` / `jsx: react-jsx` | nothing (blocks) / classic `jsxFactory: "jsx.createElement"` (.tsx) |
