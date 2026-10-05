# Transform rules: what happens to a reactive block

Source: `packages/dataflow/src/html/{TransformationController,NodeDefinition,ScriptTransformer,EndTransformer,DOMTransformer,TopologicalSort}.ts`,
`src/javascript/*`, `src/scopes/analyze.ts`, tests in `test/html/*`, `test/javascript/*`.

## Contents
1. Pipeline
2. Selectors and scopes (body, islands)
3. Inputs (free identifiers)
4. Outputs (top-level declarations)
5. Display, slots and `data-echo`
6. Imports and async
7. Topological sort, cycles, duplicates
8. Emitted code
9. Type transformers (and TypeScript)
10. Debugging checklist

---

## 1. Pipeline

```
HTML ─► HTMLTransformer (HTMLRewriter, streaming)  ─┐
     └► DOMTransformer  (any Document, in place)   ─┤
                                                     ▼
                          TransformationController
   per <script is="reactive">: trimIndent → key → typeTransformer? → NodeDefinition.parse
   at end of each scope element: topological sort → one <script is="reactive-runtime">
```

Per block, `NodeDefinition.parse(js, key)`:
1. Parse with acorn + acorn-jsx (`ecmaVersion: "latest"`, `sourceType: "module"`). Plain JS + JSX.
2. Rewrite JSX → `jsx.createElement(...)` (so `jsx` becomes an input).
3. Inputs = unresolved references; outputs = top-level declarations + import locals.
4. Static imports removed and hoisted into one `await Promise.all([import(...)])`.
5. Regenerate code with astring (comments dropped).
6. Any exception (syntax error, unsupported JSX) → the block becomes `display("<error message>")`,
   so the message appears where the block was. Check the page for such text when debugging.

The script element is removed. If the block displays (implicitly or via `display`/`view`) or
uses `width`, a `<slot name="KEY"></slot>` is left exactly where it was. That slot is empty in
the served HTML (client-rendered only) and stays in the DOM as the output's parent — see
SKILL.md "Where output lands".

## 2. Selectors and scopes

```ts
DefaultSelectors = {
  start:  'head',                                            // import map is prepended here
  script: 'script[data-reactive],script[is=reactive]',       // reactive blocks
  end:    'body,*[data-reactive-island],*[is=reactive-island]' // scope elements
}
```
- `<script type="module" is="reactive">` is the documented form; `<script data-reactive>` works
  too. The old bare `reactive` attribute does nothing. Use the documented `type="module"
  is="reactive"` form; `is` doesn't stop execution, so a page served *untransformed* still runs
  the block as a module (and it fails: JSX syntax error / missing implicit names) — always serve
  through the transformer.
- Each `end` element opens a scope; blocks belong to the innermost open scope. Scopes are fully
  isolated — an island does **not** see body-level names (they resolve to `globalThis` →
  `undefined`). Each scope gets its own runtime script (appended as its last child) and graph.
- A reactive script outside any scope (in `<head>`, or a fragment with no `<body>`/island) makes the
  transform throw. Wrap fragments in `<div is="reactive-island">`.
- Custom selectors: `new HTMLTransformer({rewriter, selectors: {end: '#app'}})`.

Keys: the script's `id` attribute if present (`<script id="chart" is="reactive">` → slot
`chart`), otherwise `simpleHash(source)_<counter>`. Counter is per transformer instance → use a
fresh transformer per document. Don't give a block an `id` equal to one of its output names.

## 3. Inputs (free identifiers)

- Single-pass scope analysis: `var` hoists to function scope; `let/const/class/function/import/params/catch`
  bind in their block; functions, arrows, blocks, loops, catch, classes, switch create scopes.
  Destructuring patterns bind correctly; default values in patterns are references.
- Not references: `obj.prop`, non-computed object keys, labels, method keys. Shorthand `{x}` IS a
  reference to `x`.
- **Globals are inputs too** (`document`, `window`, `fetch`, `Math`, `Date`, `console`…). At
  runtime each becomes a dependency-free node read once from `globalThis` — not reactive. A
  misspelled name is silently `undefined`.
- References inside nested functions still count: `const f = () => g` makes the whole block
  depend on `g` (re-runs and redefines `f` whenever `g` changes).
- Filtered/renamed: `display`, `view` (injected locally), `observe/events/input/mutable/raw`
  (module imports), `width` → `width_KEY`. `jsx` and `now` stay as graph inputs.
- **Forward references inside one block become self-dependencies.** Because analysis is single
  pass, a name used before its top-level declaration *in the same block* is recorded as unresolved
  while also being an output of that block → "Circular dependency: block KEY uses 'g' before declaring it":
  ```js
  const f = () => g();   // ✗ g used before declared in this block
  const g = () => 1;
  ```
  Declare before use within a block (function declarations included), or split blocks. Direct
  recursion (`function fib(n) { return fib(n-1) }`) is fine.

## 4. Outputs (top-level declarations)

Outputs are only from `program.body`:
- `const/let/var` declarators whose id is a plain identifier: `const x = 1, y = 2` → `x`, `y`.
- `function name(){}`, `class Name {}`.
- Every static import local.
- Dropped: `display`, `view`, `width`.

Not outputs:
- Destructuring: `const {a, b} = obj`, `const [x, y] = arr` → nothing (other blocks see
  `undefined`). Use `const a = obj.a;`.
- Anything in a `{ ... }` block, nested `var`s, assignments (`x = 5`, `count++`).
- `export const q = 1` → not an output and the generated function contains `export` → broken. Never
  use `export`.

Assigning to another block's variable only reassigns the local parameter — use `mutable`.

## 5. Display, slots and data-echo

Body selection (first match wins):
1. Block has outputs → `body; return {out1, out2};`
2. Block is exactly one `ExpressionStatement` (after imports are removed) and doesn't reference
   `display`/`view` → `return display(<expr>)`
3. Otherwise → body verbatim (renders only through explicit `display`/`view`).

| Block | Result |
|---|---|
| `` `Hello ${name}` `` / `<p>{x}</p>` / `a ? <b/> : ''` / `x + 1;` | displayed |
| `const x = 1;` | output `x`, no slot |
| `const a = 1; a + 1` | output `a`; `a + 1` NOT displayed |
| `import {f} from 'm'; f(1)` | output `f`; NOT displayed (imports are outputs) |
| `{a: 1}` | a labelled block statement — nothing; write `({a: 1})` (but objects don't render anyway) |
| `{cond && <b/>}` | a block statement — nothing rendered, no slot |
| `el.focus()` / `x = 5` | wrapped in `display(...)` (renders the return value if string/number/Node) |
| `{ el.focus(); }` | statement, nothing displayed |
| `const n = view(<input/>)` | slot + `view`/`display` injected; output `n` |
| `const x = ;` | `display("Unexpected token (1:10)")` |

Semicolons don't change behaviour (unlike Observable).

`data-echo` on a reactive script additionally emits `<pre><code class="language-javascript">` with
the source; `data-echo="html"` echoes the whole `<script>` tag. Used for docs/tutorials.

## 6. Imports and async

```js
import * as Plot from "@observablehq/plot";     // → const [Plot] = await Promise.all([import('@observablehq/plot')]);
import d3 from "https://esm.run/d3";            // → const [{default:d3}] = ...
import {range, select} from "@observablehq/inputs"; // → const [{range,select}] = ...
```
- Imports become outputs: one block imports, every block can use `Plot`.
- The block becomes `async`. So does any block with top-level `await`, `for await`, or
  `await using`. `await` inside nested functions doesn't count. `const m = await import('x')`
  works and `m` is an output.
- Broken forms (avoid):
  - `import {x as y} from 'm'` → generates `{y}` → reads export `y`, not `x`.
  - `import d, {x} from 'm'` → only `d` is kept.
  - `import 'm'` (side-effect only) → error displayed. Use `await import('m')` in a `{}` block.
  - Two imports from the same source in one block → the first is lost. Combine them.
- Specifiers are emitted verbatim inside `import('...')`: bare specifiers need an import map
  (transformer `importMap` option, or your own `<script type="importmap">`), or use full URLs.

## 7. Topological sort, cycles, duplicates

- Kahn's algorithm per scope; edge A→B iff an input of B is an output of A. Ties keep document
  order. Globals are ignored for sorting.
- Cycle between blocks → `Error("Circular dependency: block A needs 'b' from block B, which needs 'a' from block A")`
  (block keys are the script `id` or the generated hash) thrown from the transform — the whole page fails, not just one block. Break cycles with a `mutable` (a block
  writes via an action function, another reads the value) — the write is a closure call, not a
  graph edge.
- Duplicate output names across blocks → no error; last definition silently wins. Wrap scratch
  locals in `{}` and prefix names per section.

## 8. Emitted code

```html
<script type="module" is="reactive-runtime" id="yzo1ae_5">
import {runtime,mutable,Display,View,JSX2DOM,autoKeyEvents,chain,Width,now} from "@bodar/dataflow/runtime.ts";
const _runtime_ = runtime({"scriptId":"yzo1ae_5","idle":false}, globalThis);
_runtime_.graph.define("jsx",[],[],() => new JSX2DOM(chain({onEventListener: autoKeyEvents()}, globalThis)));
_runtime_.graph.define("now",[],[],() => now());
_runtime_.graph.define("width_k1",[],[],() => Width.for("k1", _runtime_));
_runtime_.graph.define("hv7xlq_1",["jsx"],["name"],(jsx) => {
const display = Display.for("hv7xlq_1", _runtime_);
const view = View.for(display);
const name = view(jsx.createElement("input", {"value": "Dan"}));
return {name};
});
_runtime_.graph.define("r9tgct_0",["name"],[],(name) => {
const display = Display.for("r9tgct_0", _runtime_);
return display(`Hello ${name}`)
});
_runtime_.graph.run();
</script>
```
- Only used names are imported. Registrations are in topological order.
- `runtime({scriptId})` sets `reactiveRoot` to the runtime script's parent element; `display` and
  `width` look their slot up under that root, skipping slots inside nested islands (keys are only
  unique per transform, so separately-transformed fragments can reuse a key). The runtime script
  id is still looked up document-wide, so inserting the *same* transformed fragment twice makes
  both copies bind to the first one's root. `idle: true` (testing) wraps the throttle in `Idle`.
- The `@bodar/dataflow/runtime.ts` import is a bare specifier: the page needs an import map entry
  or the transformer's `bundler` to inline it (see deployment.md).

## 9. Type transformers (and TypeScript)

`typeTransformers: Record<type, (content: string, attributes: Map<string,string>, key: string) => string>`
pre-processes a block by its `type` attribute (default `module`) into JS before analysis. The
script must still match the reactive selector. Example from tests:
```ts
new HTMLTransformer({rewriter: new HTMLRewriter(), typeTransformers: {
  sql: (content, attrs, key) => `const ${key}_result = executeSql(\`${content}\`);`
}});
// <script type="sql" is="reactive" id="query">SELECT 1</script> → outputs query_result, input executeSql
```
This is the hook a future TypeScript path would use. **There is no TypeScript support today**
(planned once the TypeScript 7.1 Go-based compiler API is available). Don't register a homemade
type-stripping "ts" transformer and claim TS works; write plain JS (+ JSDoc if useful).

## 10. Debugging checklist

- **Nothing renders**: block has declarations → add `display(...)`; value is an array/boolean/
  object/Promise; block is a `{...}` statement; a dependency never emitted (no initial value,
  rejected promise, upstream threw — check the console); reactive script outside `<body>`/island.
- **Error text appears in the page**: parse error — TS syntax, JSX comment `{/* */}`, spread
  children `{...xs}`, namespaced attr/tag, side-effect import.
- **Value is `undefined` in another block**: destructured declaration; name declared inside `{}`;
  typo (global lookup); island isolation; reserved name (`input`, `events`…) shadowed by runtime.
- **"Circular dependency"**: the message names the blocks and values. "uses 'x' before declaring it" is a
  forward reference inside one block; "needs … from block …" is a genuine cycle between blocks.
- **State resets**: the `mutable` block has a reactive input and re-ran.
- **Input stops working / loses focus**: the `view`/input block depends on changing state.
- **Runtime fails to load in the browser**: missing import map/bundler for `@bodar/dataflow/runtime.ts`
  or for a library import.
