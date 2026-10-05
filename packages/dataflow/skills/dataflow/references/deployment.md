# Deployment, serving and testing

Source: `packages/dataflow/src/http/ReactiveHandler.ts`, `src/html/HTMLTransformer.ts`,
`src/html/DOMTransformer.ts`, `src/bundling/*`, `src/testing/*`, `server.ts`, `docs.ts`,
`docs/setup.html`, `docs/islands.html`.

## Contents
1. Mental model: the transform is a pure function of HTML
2. Import paths (there is no root export)
3. Resolving the runtime: import map vs bundler vs bring-your-own
4. HTTP intercept with ReactiveHandler (Bun, Cloudflare, Deno, Node, service worker)
5. Static build
6. In-browser DOMTransformer
7. Islands and HTML-over-the-wire (HTMX etc.)
8. Testing pages (renderAndExecute + Idle)
9. Repo commands
10. Gotchas

---

## 1. Mental model

Transformation is **HTML in → reactive HTML out**, a deterministic function of the HTML text (ids
are hash + counter). So it can run anywhere, and the output is cacheable:

| Where | How |
|---|---|
| **Request time, as an HTTP intercept** (author's preferred) | `ReactiveHandler(factory, upstream)` in front of static files or a server-rendered origin, at the edge (Cloudflare) or in any fetch-style server. No build step; cache the output. |
| Build time (static site) | `await new HTMLTransformer(...).transform(htmlString)` per file, write the result. |
| Browser service worker | `ReactiveHandler` + `htmlrewriter` npm (WASM). |
| Browser, in-page | `DOMTransformer` over a `Document` (ships acorn; dev/prototyping). |
| Tests | `renderAndExecute(parseHTML, html)` under Bun. |

Output: each reactive script is removed (leaving `<slot name=…>` if it displays), and each scope
(`<body>` or island) gets one `<script type="module" is="reactive-runtime">` that starts with
`import {runtime, …} from "@bodar/dataflow/runtime.ts";`. **That bare specifier must resolve in
the browser** — the #1 deployment detail.

## 2. Import paths

There is **no root export** — `import … from '@bodar/dataflow'` (seen in older README/setup page)
fails. Always import file subpaths:
```
@bodar/dataflow/html/HTMLTransformer.ts         HTMLTransformer, DefaultSelectors, types
@bodar/dataflow/html/DOMTransformer.ts          DOMTransformer
@bodar/dataflow/http/ReactiveHandler.ts         ReactiveHandler
@bodar/dataflow/bundling/BunBundler.ts          BunBundler (Bun only)
@bodar/dataflow/bundling/bundle.ts              bundleFile, bundleText, transpileFile (Bun only)
@bodar/dataflow/testing/renderAndExecute.ts     renderAndExecute
@bodar/dataflow/testing/Idle.ts                 Idle
@bodar/dataflow/runtime.ts                      runtime + all runtime API
@bodar/dataflow/Graph.ts, BaseGraph.ts          programmatic graph
@bodar/jsx2dom/JSX2DOM.ts                       JSX2DOM
@bodar/jsx2dom/PositionalJSX.ts                 PositionalJSX, place, flatten, stableListener
```
Install (published on JSR): `bunx jsr add @bodar/dataflow` · `npx jsr add @bodar/dataflow` ·
`deno add jsr:@bodar/dataflow`. In this monorepo use the workspace package.

## 3. Resolving `@bodar/dataflow/runtime.ts`

1. **Import map (recommended; best with islands)** — the transformer prepends
   `<script type="importmap">` into `<head>`:
   ```ts
   const importMap = {imports: {'@bodar/dataflow/runtime.ts': 'https://dataflow.bodar.com/runtime.js'}};
   const transformer = () => new HTMLTransformer({rewriter: new HTMLRewriter(), importMap});
   ```
   `https://dataflow.bodar.com/runtime.js` is the minified runtime (~5 KB gzipped), built from
   `src/runtime.ts` by `docs.ts`. It is unversioned (tracks master); self-host it (`Bun.build({entrypoints:
   ['src/runtime.ts'], minify: true})`) if you need to pin. Add entries for any other bare imports
   used in blocks, e.g. `"@observablehq/": "https://esm.run/@observablehq/"`, or use full URLs in
   the blocks.
2. **Bundler (Bun only)** — inlines the runtime into each runtime script:
   ```ts
   import {BunBundler} from "@bodar/dataflow/bundling/BunBundler.ts";
   const transformer = () => new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: new BunBundler()});
   ```
   ~14 KB minified (~5 KB gzipped) **per scope** (each island gets a copy). Uses `Bun.build` in memory;
   a block's imports resolve as if it sat in the working directory (`new BunBundler(minify, dir)` to
   choose another), so deps must be installed there; fails the transform if an import can't be
   resolved. Not usable on Cloudflare/Deno/Node. Any object `{transform(js: string): Promise<string>}`
   can be passed as `bundler`.
3. **Bring your own** — pass neither; your page/template already has an import map mapping
   `@bodar/dataflow/runtime.ts` (common with server-side templates/HTMX).

**Browser support.** The runtime needs `Promise.withResolvers` (Safari/WKWebView 17.4+) and
`Symbol.asyncDispose`/`Symbol.dispose` (it uses `await using`; bundlers lower it to a helper that
throws "Object not disposable" without the symbols). Older Safari, WKWebView and WebKitGTK (e.g.
Tauri on Linux) lack them: polyfill in a classic script before the runtime loads, or nothing renders:
`<script>Symbol.asyncDispose ??= Symbol.for('Symbol.asyncDispose'); Symbol.dispose ??= Symbol.for('Symbol.dispose');</script>`

`HTMLTransformer` options: `{rewriter (required), bundler?, importMap?, selectors?, idGenerator?,
idle?, typeTransformers?}`. `transform(string): Promise<string>`, `transform(Response|Blob|BufferSource): Response`.
Handlers bind to the rewriter in the constructor → **one transformer + one `new HTMLRewriter()` per
document**.

## 4. HTTP intercept: ReactiveHandler

```ts
// src/http/ReactiveHandler.ts
export function ReactiveHandler(transformer: () => HTMLTransformer, http: (r: Request) => Promise<Response>) {
    return async (request: Request) => {
        const response = await http(request);
        if (response.status === 200 && response.headers.get("content-type")?.includes('html'))
            return transformer().transform(response);   // streaming rewrite
        return response;
    }
}
```
- First argument is a **factory**. Only `200` + `content-type` containing `html` is transformed —
  make sure the upstream sets it (304s, 404 pages, `text/plain` pass through untouched).
- Plain fetch-style handler: plugs into `Bun.serve`, Cloudflare Workers, `Deno.serve`, Hono,
  service workers.

**Bun, static files:**
```ts
import {ReactiveHandler} from "@bodar/dataflow/http/ReactiveHandler.ts";
import {HTMLTransformer} from "@bodar/dataflow/html/HTMLTransformer.ts";

const importMap = {imports: {"@bodar/dataflow/runtime.ts": "https://dataflow.bodar.com/runtime.js"}};
const transformer = () => new HTMLTransformer({rewriter: new HTMLRewriter(), importMap});

Bun.serve({
    port: 3000,
    fetch: ReactiveHandler(transformer, async request => {
        const path = new URL(request.url).pathname;
        const file = Bun.file(`./public${path.endsWith('/') ? path + 'index.html' : path}`);
        if (!(await file.exists())) return new Response('Not Found', {status: 404});
        return new Response(file);              // Bun sets text/html for .html
    })
});
```

**Cloudflare Worker in front of an origin (edge intercept; cache the result):**
```ts
import {ReactiveHandler} from "@bodar/dataflow/http/ReactiveHandler.ts";
import {HTMLTransformer} from "@bodar/dataflow/html/HTMLTransformer.ts";
const importMap = {imports: {"@bodar/dataflow/runtime.ts": "https://dataflow.bodar.com/runtime.js"}};
const transformer = () => new HTMLTransformer({rewriter: new HTMLRewriter(), importMap});
export default {fetch: ReactiveHandler(transformer, request => fetch(request))};
```
Cloudflare and Bun have a global `HTMLRewriter`. Origin can be static hosting or any server
emitting HTML with reactive blocks — the origin needs no knowledge of dataflow.

**Caching at the edge** (guidance; Workers-specific code is not exercised in this repo):
- The output is a deterministic function of (input HTML, dataflow version). Cache the
  *transformed* response, e.g. Workers Cache API keyed by URL, so the transform runs once per
  origin version.
- `ReactiveHandler` passes upstream headers through unchanged (`ETag`, `Last-Modified`,
  `Cache-Control`, even `Content-Length`) while the body changes. Include the dataflow/runtime
  version in the cache key or rewrite the `ETag` (e.g. append a version suffix), otherwise a
  transformer upgrade serves new bytes under the old validator.
- Non-200 responses (incl. `304`) pass through untransformed — correct only if the client's
  cached copy was the transformed one, which holds when the intercept always sits in front.
- Keep the origin's `Cache-Control`. Pin (self-host) `runtime.js` if you cache pages long-term;
  the hosted `https://dataflow.bodar.com/runtime.js` is unversioned.

**Deno / Node:** no global `HTMLRewriter` — supply one (e.g. the `htmlrewriter` npm package) or
use `DOMTransformer` yourself. Node's `http` isn't fetch-based; use Hono and pass the raw request:
`app.get('/*', c => handler(c.req.raw))` (the setup page passes the handler directly; Hono handlers
receive a Context, so adapt — unverified in repo).

**Service worker (browser):**
```js
import {ReactiveHandler} from '@bodar/dataflow/http/ReactiveHandler.ts';
import {HTMLTransformer} from '@bodar/dataflow/html/HTMLTransformer.ts';
import {HTMLRewriter} from 'htmlrewriter';
const handler = ReactiveHandler(() => new HTMLTransformer({rewriter: new HTMLRewriter(), importMap}), fetch);
self.addEventListener('fetch', event => event.respondWith(handler(event.request)));
```
The first page load before registration isn't transformed. Heavy (WASM + acorn).

**Compression:** the repo's `src/http/CompressionHandler.ts` (not exported on JSR; ~45 lines) is
composed *outside*: `CompressionHandler(ReactiveHandler(factory, router))`. The upstream
`Content-Length` survives the rewrite even though the body grows; Bun.serve fixes it on the wire —
elsewhere strip it or compress outside.

## 5. Static build

```ts
// docs.ts (simplified)
import {Glob, file, write} from "bun";
import {HTMLTransformer} from "@bodar/dataflow/html/HTMLTransformer.ts";
import {BunBundler} from "@bodar/dataflow/bundling/BunBundler.ts";
for await (const path of new Glob("**/*").scan({cwd: srcDir, onlyFiles: true})) {
    const src = file(`${srcDir}/${path}`);
    if (path.endsWith(".html")) {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: new BunBundler()});
        await write(`${outDir}/${path}`, await transformer.transform(await src.text()));
    } else await write(`${outDir}/${path}`, src);
}
```
Swap `bundler` for `importMap` to keep pages tiny and share one cached runtime.

## 6. In-browser DOMTransformer

```js
import {DOMTransformer} from '@bodar/dataflow/html/DOMTransformer.ts';
const doc = new DOMParser().parseFromString(html, 'text/html');
await new DOMTransformer({importMap}).transform(doc);     // mutates in place
// or: await new DOMTransformer({importMap}).transform(iframe.contentDocument);
```
Options as HTMLTransformer minus `rewriter`. Output is identical to HTMLTransformer (contract
tested). Scripts in a DOMParser document don't execute until placed in a live document. Ships acorn
— prefer server/edge transformation in production.

## 7. Islands and HTML-over-the-wire

```html
<div class="comments-widget" is="reactive-island">
    <script type="module" is="reactive">
        const count = mutable(0);
        const increment = () => count.value++;
    </script>
    <script type="module" is="reactive">
        <button onclick={increment}>Clicked {count}</button>
    </script>
</div>
```
- `is="reactive-island"` (or `data-reactive-island`) = isolated scope, own graph, own runtime script
  injected before the island's closing tag. Same names in different islands don't clash; islands
  don't see body-level names.
- Fragments returned to HTMX/Unpoly/Datastar swaps must contain the island element (no `<body>` → no
  scope otherwise → transform throws). Put `ReactiveHandler` in front of the fragment endpoint (it
  only needs `200` + html content-type). Whether swapped-in module scripts execute is up to the swap
  library.
- Prefer the import-map strategy with islands (one shared runtime vs a bundled copy per island).

## 8. Testing pages

```ts
import {test, expect} from "bun:test";
import {parseHTML} from "linkedom";
import {renderAndExecute} from "@bodar/dataflow/testing/renderAndExecute.ts";
import html from "./counter.html" with {type: "text"};

// Wrapper parser: patches linkedom gaps (see below). The cast is needed because linkedom's
// return type isn't `Window & typeof globalThis`.
const parser = (source: string) => {
    const w: any = parseHTML(source);
    Object.defineProperty(w.HTMLInputElement.prototype, 'valueAsNumber',
        {get() { return this.value === '' ? NaN : Number(this.value); }});
    Object.defineProperty(w.HTMLInputElement.prototype, 'valueAsDate',
        {get() { return this.value === '' ? null : new Date(this.value); }});
    Object.defineProperty(w.HTMLSelectElement.prototype, 'type',
        {get() { return this.multiple ? 'select-multiple' : 'select-one'; }});
    Object.defineProperty(w.HTMLSelectElement.prototype, 'value', {get() {   // linkedom option.value
        const o = this.querySelector('option[selected]') ?? this.querySelector('option');  // is '' w/o attr
        return o ? (o.getAttribute('value') ?? o.textContent) : '';
    }});
    return w;
};

test("increments", async () => {
    const {browser, idle} = await renderAndExecute(parser, html);
    browser.document.querySelector('button')!.click();
    await idle.fired();
    expect(browser.document.querySelector('p')!.textContent).toBe("Clicked 1 time");
});

test("typing drives view()/input()", async () => {
    const {browser, idle} = await renderAndExecute(parser, html);
    const el = browser.document.querySelector('input')!;
    el.value = '100';
    el.dispatchEvent(new browser.Event('input', {bubbles: true}));   // the window's own Event
    await idle.fired();
});
```
`view()`/`input()` listen for `input` (checkbox/button: `click`, file: `change`), so set `.value`
and dispatch that event; `.click()` alone only covers buttons/checkboxes. The select polyfill
reads the `selected` *attribute*; to change a selection in a test, toggle that attribute on the
options, then dispatch `input`.

Where the test lives: inside bodar.ts put ad-hoc tests under `packages/dataflow/test/` and import
`../../src/testing/renderAndExecute.ts` (the existing tests use relative `src` imports). Outside
the monorepo, add `@bodar/dataflow` and `linkedom` as dev dependencies (ask first). HTML fixtures
outside the project can be read with `readFileSync` instead of a `with {type: "text"}` import.
```ts
renderAndExecute(htmlParser: (html: string) => Window & typeof globalThis, html: string, global = globalThis)
  : Promise<{browser, idle: Idle, graph: BaseGraph, [Symbol.asyncDispose]}>
```
- Tear a page down when its test ends — `await using page = await renderAndExecute(…)`, or
  `await page[Symbol.asyncDispose]()` in `afterEach` — so its blocks' resources (frame loops,
  timers, sockets with `[Symbol.dispose]`) and event listeners don't run on into later tests.
- Transforms with `HTMLTransformer({rewriter: new HTMLRewriter(), idle: true})` (needs Bun's global
  `HTMLRewriter`), parses with your parser (linkedom), runs the **first** runtime script only (no
  multi-island pages), resolving globals from the parsed window first, then real globals.
- After every interaction: `await idle.fired()` (resolves ~2 ms after the last pending throttle tick has resolved, so a slow frame keeps the page busy).
  `fired()` only resolves after further graph activity — calling it when nothing is pending (e.g.
  after work driven by your own timers already finished) hangs until the test times out. For
  timer/fetch-driven updates, wait for the time instead.
- Pages using `now` or a never-ending generator **never go idle** (every frame resets the 2 ms
  timer), so `idle.fired()` hangs. Await a fixed delay (`setTimeout`) and assert that the value
  changed between two snapshots. `bun test` still exits normally while `now` keeps ticking.
- Globals resolve via `chain(linkedomWindow, global)`: names the linkedom window defines — even as
  `undefined` — shadow real globals. Verified: `console` is `undefined` inside blocks under
  `renderAndExecute`, while `fetch`/`setTimeout` fall through. Pass needed globals in the third
  argument, or as linkedom's overlay: `parseHTML(source, {console, requestAnimationFrame})`.
- **Writing to the parsed window writes to `globalThis`.** linkedom's window is a `Proxy` over the
  real `globalThis` (only `add/removeEventListener`/`dispatchEvent` stay per window), so
  `w.requestAnimationFrame = …` in a wrapper parser changes it for every later test in the process.
  Stub through the overlay above instead: it is read first and never touches `globalThis`.
- Parse a full document (`<html><body>…</body></html>`): without the wrapper linkedom makes the
  first element the `documentElement`, and `document.body` isn't the parsed content.
- linkedom ignores `addEventListener`'s `{signal}` option, so the abort-signal cleanup idiom doesn't
  remove listeners in tests. Where a test depends on it, also remove explicitly:
  `signal.addEventListener('abort', () => el.removeEventListener(type, handler))`.
- Bun takes JSX settings from the `tsconfig.json` in the **working directory**, not the one nearest
  the file: run `bun test` from the directory whose tsconfig sets `jsxFactory: "jsx.createElement"`,
  or a lib `.tsx` compiles to `react/jsx-dev-runtime` calls.
- linkedom gaps (patch in a wrapper parser as above):
  - No `HTMLInputElement.valueAsNumber`/`valueAsDate`: `view(<input type="number"|"range"|"date">)`
    yields `undefined` (dependents see `undefined`, not a number). Handlers doing
    `mutable.value = e.target.valueAsNumber` likewise set `undefined`.
  - `<select>` has `.type === undefined` and `.value === ''` regardless of the selected option, so
    `view(<select>)` emits `''` (and select-multiple isn't detected).
  - No `HTMLFormElement.prototype.submit/reset` — the repo tests polyfill them
    (`packages/dataflow/test/examples/todo.test.ts` `fixForm`) and dispatch `submit`; no
    `form.elements`. Prefer `form.querySelector('[name=x]').value` in handlers.
  - Browser-only APIs (ResizeObserver → `width`, WASM, audio) aren't testable this way.
- `linkedom` must be a dev dependency of your project (ask before adding).
- Pure transform assertions: `await new HTMLTransformer({rewriter: new HTMLRewriter()}).transform('<body>…</body>')`
  and compare strings, as `packages/dataflow/test/html/HTMLTransformer.test.ts` does.
- The repo's example tests use the docs pages themselves as fixtures
  (`test/examples/{todo,comments}.test.ts`).

## 9. Repo commands (from monorepo root)
- `./run demo` — dev server on http://localhost:3000/ serving `packages/dataflow/docs` via
  ReactiveHandler + import map (`"@bodar/": "/"` → `.ts` bundled on the fly). Edit + refresh.
- `./run docs` — static build to `packages/dataflow/out`.
- `./run test [path]`, `./run check`, `./run` (full build).

## 10. Gotchas (beyond those in SKILL.md)
1. No root export; always `.ts` subpaths.
2. Without `importMap`/`bundler`/own import map, the runtime import fails in the browser.
3. `HTMLRewriter` is global only in Bun and Cloudflare Workers.
4. `BunBundler` is Bun-only and per-scope.
5. A page needs `<body>` or an island for scripts; the import map needs `<head>`.
6. Block output is client-rendered only: the served HTML has an empty `<slot>` per block (no SSR,
   no hydration, nothing for crawlers/no-JS). Put content that must be in the initial HTML in the
   static/server-generated markup around the blocks.
