# JSX in dataflow (@bodar/jsx2dom)

Source: `packages/jsx2dom/src/JSX2DOM.ts`, `boolean-attributes.ts`, `svg-elements.ts`,
`types.d.ts`; dataflow's compiler `packages/dataflow/src/jsx-transform/transformer.ts`;
`src/html/SlotRenderer.ts`.

## Contents
1. Two pipelines, one convention
2. What JSX compiles to
3. JSX2DOM.createElement rules (attributes, events, style, booleans, children)
4. SVG
5. Rendering into slots / reconciliation
6. Unsupported syntax
7. React → jsx2dom table

---

## 1. Two pipelines, one convention

**Inside reactive blocks (HTML pages):** the dataflow transformer compiles JSX itself at transform
time. You import nothing, configure nothing; `jsx` is a graph node
`new JSX2DOM(chain({onEventListener: autoKeyEvents()}, globalThis))` created only if some block uses
JSX. Don't declare your own `jsx`, don't import React/`h`/JSX2DOM in blocks, and don't add a
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

| JSX | Output |
|---|---|
| `<div />` | `jsx.createElement("div", null)` |
| `<Foo />` / `<A.B />` | `jsx.createElement(Foo, null)` — **crashes at runtime** (no components) |
| `<div id="x" />` / `<div id={x} />` | `jsx.createElement("div", {"id": "x"})` / `{"id": x}` |
| `<input disabled />` | `{"disabled": true}` |
| `<div a="1" {...p} b={2} />` | `{"a": "1", ...p, "b": 2}` (order kept, later wins) |
| `<div>a{b}c</div>` | `jsx.createElement("div", null, ["a", b, "c"])` |
| `<>…</>` | `jsx.createElement(null, null, [...])` → DocumentFragment |

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
autoKeyEvents(): (element) => void   // sets data-key="0", "1", … on elements given handlers
```

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
   - `value`, `checked` on inputs set the **initial/default** state only (no controlled inputs).
   - `<select value={v}>` does nothing; mark `<option selected={o === v}>` instead.
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
  Use `cond ? <X/> : ''` (or `[]`), never `cond && <X/>`.
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

## 5. Rendering into slots / reconciliation

There is no virtual DOM, no hooks, no keys. Each run of a block creates new nodes; the slot
renderer then does a **positional, top-level** update:
```ts
while (slot.childNodes.length > newNodes.length) slot.removeChild(slot.lastChild);
for (i…) if (!old) append(new); else if (!new.isEqualNode(old)) old.replaceWith(new);
```
- The slot (`<slot name=KEY>`, `display: contents` by default) stays in the DOM as the parent of
  the output — child combinators/structural pseudo-classes see the slot, not your nodes.
- Equal nodes are kept (preserving focus/scroll/typed text, since `isEqualNode` compares
  attributes, not live properties).
- Any difference anywhere inside → the whole top-level node is replaced.
- `autoKeyEvents` gives every element with a handler a unique `data-key`, so subtrees containing
  handlers are **never equal** and are always replaced (on purpose: otherwise the old element with
  a stale closure would be kept). Consequence: interactive controls in a block that re-runs lose
  focus/caret each run → keep typed-into inputs in blocks that don't re-run, and derived output in
  separate blocks.
- Canvas caveat: if a canvas-creating block re-runs and builds an identical `<canvas>`, the old one
  stays on screen and the new (detached) one is what draw blocks receive. Make canvas blocks
  depend only on things that change their attributes (size).

## 6. Unsupported syntax (shows an error in the slot, or fails at runtime)

- `{/* comment */}` inside JSX → transform error. Put JS comments outside JSX.
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
| `{cond && <X/>}`, `{n && <X/>}` | `{cond ? <X/> : ''}`, `{n > 0 ? <X/> : ''}` |
| `<Comp a={1}/>` | `{comp({a: 1})}` — plain function returning nodes |
| `key={id}` | not needed (harmless attribute) |
| `ref={r}` / `useRef` | `const el = <canvas/>;` — the element itself |
| `dangerouslySetInnerHTML` | `el.innerHTML = trusted` |
| controlled `value`/`onChange` | `const v = view(<input value="init"/>)` |
| `<select value={v}>` | `<option selected={o === v}>` |
| `<textarea value={v}/>` | `<textarea>{v}</textarea>` |
| Svelte `class:active={x}` / Vue `:class="{active: x}"` | `class={x ? 'active' : ''}` |
| Svelte `on:click` / Vue `@click` | `onclick={f}` |
| Svelte `style:color={c}` / Vue `:style` | `style={{color: c}}` / `` style={`color: ${c}`} `` |
| Svelte `{@html x}` / Vue `v-html` | `el.innerHTML = x` on an element you hold |
| `import React` / `jsx: react-jsx` | nothing (blocks) / classic `jsxFactory: "jsx.createElement"` (.tsx) |
