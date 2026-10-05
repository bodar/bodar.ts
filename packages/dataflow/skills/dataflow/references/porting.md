# Porting React / Svelte / Vue to dataflow

The repo's `packages/dataflow/docs/examples/todo.html` is a port of the MDN React todo app
(~66 lines in one HTML file vs ~300 lines + ~150 KB bundle). Use it as the reference port.

## Contents
1. The method (do this in order)
2. Concept translation table (React, Svelte, Vue)
3. Side-by-side examples
   a. Counter + document title (React)
   b. Fetch on change with cleanup (React useEffect)
   c. Todo list with props/callbacks (React) / stores (Svelte)
   d. Two-way bound inputs (Vue v-model / controlled inputs)
   e. Subscriptions and timers (useEffect + cleanup, onMount/onDestroy)
   f. Context / global store / reducer
4. Components, reuse, per-instance state, live DOM state, imperative widgets, Web Components
5. Routing
6. When structure isn't knowable at transform time
7. Porting checklist

---

## 1. The method

1. **Start from the HTML.** Write the static markup the app renders (layout, headings, empty
   containers) as plain HTML. Anything that never changes stays static — no block.
2. **Find the state** (useState/useReducer/stores/refs/`$state`/`ref()`): identify the *minimal*
   source values. Each becomes a `view(...)` (if it is just an input's value), an `events`/`observe`
   source (if it comes from the outside world), or a `mutable` + action functions (if code writes it).
3. **Find the derived values** (useMemo, `$:`, `$derived`, `computed`, selectors): usually inline
   them in the view expression that uses them; only give one a named `const` (in a block that
   references its sources) when several blocks share it. No dependency arrays — references *are*
   the dependencies.
4. **Find the views** (JSX/templates): each distinct region becomes a block placed where it
   renders. Split regions by what they depend on, so each re-runs only for its own inputs
   (optional: a re-running block keeps its inputs' elements, focus and typed text); lists, counts
   and charts downstream.
5. **Find the effects** (useEffect, `$effect`, `watch`, onMount): each becomes a `{ ... }` block
   that references what it reacts to; cleanup becomes an invalidated output (AbortController,
   `Symbol.dispose`, `observe` cleanup).
6. **Flatten components into flows.** Props/context/prop-drilling disappear — every block can
   reference any top-level name. Components that exist only for structure become plain markup;
   reusable markup becomes plain functions returning JSX.
7. **Fix JSX dialect**: `class`, `for`, lowercase `on*` events, kebab-case SVG attrs, ternaries
   or `&&` with a boolean condition (never a number), no `<Component/>`, `key` on list rows that
   hold state, no refs (see jsx2dom.md §7).
8. **Strip TypeScript** from code moved into reactive blocks (no TS support in blocks yet — planned
   for the TypeScript 7.1 Go compiler API). Keep TS in server/build code. For a large typed
   codebase, **keep typed logic in ordinary `.ts` modules** (reducers, API clients, domain types)
   and have blocks import the compiled JS via an import-map entry or URL, leaving only thin glue
   in the blocks. The repo does this: `cross-filter-flights.html` runs
   `await import('@bodar/dataflow/vgplot/reconnecting-socket.ts')` (the dev server bundles `.ts`
   URLs on the fly; `docs.ts` transpiles it to `.js` for production). This adds no TS syntax to
   reactive blocks, so it is not a workaround for the missing block support.
9. **Test** with `renderAndExecute` (deployment.md §8) and serve via `ReactiveHandler`.

## 2. Concept translation

| React | Svelte | Vue | dataflow |
|---|---|---|---|
| `useState(v)` set by handlers | `let x = v` / `$state(v)` / `writable(v)` | `ref(v)` / `reactive({})` | `const x = mutable(v)` + actions in the same block |
| controlled `<input value onChange>` | `bind:value` | `v-model` | `const x = view(<input value="init"/>)` |
| `useMemo(() => f(a, b), [a, b])` | `$: y = f(a, b)` / `$derived` / `derived` store | `computed` | inline `f(a, b)` where it is used; `const y = f(a, b);` block only if shared |
| `useEffect(fn, [a])` | `$: { … a … }` / `$effect` | `watch(a, fn)` / `watchEffect` | `{ …uses a… }` block |
| `useEffect` cleanup `return () => …` | `onDestroy` / `$effect` return | `onUnmounted` / `onCleanup` | invalidated output: `AbortController`, `[Symbol.dispose]`, `observe(…, return () => …)`, `invalidator.add` |
| `useEffect(fn, [])` (mount) | `onMount` | `onMounted` | a block with no changing inputs (runs once) |
| `useReducer(reducer, init)` | store + functions | Pinia store actions | `const s = mutable(init); const dispatch = a => s.update(x => reducer(x, a));` |
| `useRef` (mutable box) | plain `let` | non-reactive var | plain object `const box = {current: 0}` (writes trigger nothing) |
| `useRef` (DOM ref) | `bind:this` | template ref | `const el = <canvas/>` — JSX value *is* the element |
| `useContext` / Provider | `setContext/getContext` | `provide/inject` | just reference the top-level name |
| props | props / `$props` | props | top-level names, or function arguments for reusable markup |
| callback props `onAdd` | dispatched events | `emit` | action functions exported from the state block |
| `<Comp {...p}/>` | `<Comp/>` | `<Comp/>` | `{comp(p)}` plain function returning JSX |
| `children` | `<slot/>` / snippets | `<slot/>` | function argument: `card(title, <p>…</p>)` |
| `{cond && <X/>}` | `{#if}` | `v-if` | `cond && <X/>` with a boolean `cond`; `n > 0 ? <X/> : ''` with a number (`0` renders "0") |
| — | — | `v-show` | `hidden={!cond}` |
| `items.map(i => <li key=…/>)` | `{#each items as i (i.id)}` | `v-for` + `:key` | `items.map(i => <li key={i.id}>…</li>)` (matches rows; consumed, not an attribute) |
| CSS class transitions | `transition:` / `animate:` | `<Transition>` | `class={open ? 'panel open' : 'panel'}` in any block transitions (the element is reused); static HTML plus a `{}` effect block only for enter/leave animations (§4) |
| SSR / `getServerSideProps` / `load` | SvelteKit SSR | Nuxt SSR | server-generated static HTML + blocks; block output is client-rendered only |
| Component libraries (MUI, Radix, shadcn) | component libs | component libs | not portable — plain-DOM libraries or Web Components (§4) |
| Suspense / `use(promise)` | `{#await}` | `<Suspense>` | promise-valued `const`; dependents wait. Loading UI: async generator yielding `{loading:true}` first (patterns.md §6) |
| React Query / SWR | — | — | `fetch` in a block keyed on its inputs + AbortController |
| requestAnimationFrame loop | `tweened`/`spring` | — | `now` or a generator (patterns.md §8) |
| window resize hook | `bind:clientWidth` | `useElementSize` | `width` (container) / `events(window, 'resize', …)` |
| Redux / Zustand / Pinia | stores | Pinia | one or more state blocks with mutables + actions |
| React Router | SvelteKit routing | Vue Router | separate HTML pages, or hash route source (§5) |

Attribute/event dialect (`className`, `onClick`, `style`, `dangerouslySetInnerHTML`, Svelte
`class:`/`on:`, Vue `:class`/`@click`) → see jsx2dom.md §7.

## 3. Side-by-side examples

### a. Counter + document title

```jsx
// React
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = `Count: ${count}`; }, [count]);
  return <div>
    <button onClick={() => setCount(c => c + 1)}>+</button>
    <span className="count">{count}</span>
  </div>;
}
```
```html
<!-- dataflow -->
<script type="module" is="reactive">
    const count = mutable(0);
    const increment = () => count.value++;
</script>
<script type="module" is="reactive">
    <button onclick={increment}>+</button>
</script>
<script type="module" is="reactive">
    <span class="count">{count}</span>
</script>
<script type="module" is="reactive">
    { document.title = `Count: ${count}`; }
</script>
```
Only the `<span>` block and the title effect depend on `count`, so only they re-run (a re-running
block would keep its button anyway).

### b. Fetch on change with cleanup

```jsx
// React
const [userId, setUserId] = useState(1);
const [user, setUser] = useState(null);
const [error, setError] = useState(null);
useEffect(() => {
  const c = new AbortController();
  fetch(`/api/users/${userId}`, {signal: c.signal}).then(r => r.json()).then(setUser).catch(setError);
  return () => c.abort();
}, [userId]);
return <>
  <input type="number" value={userId} onChange={e => setUserId(+e.target.value)}/>
  {error ? <p>{error.message}</p> : user ? <h2>{user.name}</h2> : <p>Loading…</p>}
</>;
```
```html
<!-- dataflow -->
<script type="module" is="reactive">const userId = view(<input type="number" value="1" min="1"/>);</script>
<script type="module" is="reactive">
    const controller = new AbortController();            // aborted automatically when userId changes
    const user = fetch(`/api/users/${userId}`, {signal: controller.signal})
        .then(r => r.ok ? r.json() : Promise.reject(new Error(r.statusText)))
        .catch(e => ({error: e.message}));
</script>
<script type="module" is="reactive">
    user.error ? <p class="error">{user.error}</p> : <h2>{user.name}</h2>
</script>
```
Dependents simply wait for the promise (the previous content stays until then). For an explicit
"Loading…" state use the async-generator form in patterns.md §6.

### c. Todo list with props and callbacks (React) / stores (Svelte)

```jsx
// React: App owns state, passes props + callbacks down
function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const add = name => setTodos(ts => [...ts, {id: crypto.randomUUID(), name, done: false}]);
  const toggle = id => setTodos(ts => ts.map(t => t.id === id ? {...t, done: !t.done} : t));
  const visible = useMemo(() => todos.filter(FILTERS[filter]), [todos, filter]);
  return <>
    <Form onSubmit={add}/>
    <FilterButtons value={filter} onChange={setFilter}/>
    <ul>{visible.map(t => <Todo key={t.id} todo={t} onToggle={toggle}/>)}</ul>
  </>;
}
```
```svelte
<!-- Svelte -->
<script>
  import {todos, filter} from './stores.js';
  $: visible = $todos.filter(FILTERS[$filter]);
</script>
{#each visible as t (t.id)}<li class:done={t.done} on:click={() => toggle(t.id)}>{t.name}</li>{/each}
```
```html
<!-- dataflow: state + actions, then independent flows -->
<script type="module" is="reactive">
    const FILTERS = {all: () => true, active: t => !t.done, done: t => t.done};
    const todos = mutable([]);
    const add = name => todos.update(ts => [...ts, {id: crypto.randomUUID(), name, done: false}]);
    const toggle = id => todos.update(ts => ts.map(t => t.id === id ? {...t, done: !t.done} : t));
</script>

<script type="module" is="reactive">
    <form onsubmit={e => { e.preventDefault(); const field = e.target.querySelector('[name=todo]'); add(field.value); field.value = ''; }}>
        <input name="todo" required/> <button>Add</button>
    </form>
</script>

<script type="module" is="reactive">
    const filter = view(<select><option>all</option><option>active</option><option>done</option></select>);
</script>

<script type="module" is="reactive">
    <ul>{todos.filter(FILTERS[filter]).map(t =>
        <li class={t.done ? 'done' : ''} onclick={() => toggle(t.id)}>{t.name}</li>)}</ul>
</script>
```
No `Form`/`FilterButtons`/`Todo` components, no props, no keys: each flow references what it
needs by name.

### d. Two-way bound inputs (Vue v-model / React controlled inputs)

```vue
<!-- Vue -->
<script setup>
const celsius = ref(0);
const fahrenheit = computed({get: () => celsius.value * 9 / 5 + 32, set: f => celsius.value = (f - 32) * 5 / 9});
</script>
<template><input type="number" v-model="celsius"/> °C = <input type="number" v-model="fahrenheit"/> °F</template>
```
dataflow has no controlled inputs: `value={v}` is written (attribute and property) only when `v`
changes, and the input keeps focus across re-runs. To avoid echoing the user's own keystrokes back,
render the inputs once, write state from `oninput`, and push state back into the
*other* element's `.value` property from an effect:
```html
<script type="module" is="reactive">
    const celsius = mutable(0);
    const setCelsius = c => celsius.value = c;
</script>
<script type="module" is="reactive">
    const toNumber = v => Number.isFinite(v) ? v : null;   // cleared field → NaN; ignore it
    const cInput = <input type="number" value="0" oninput={e => { const c = toNumber(e.target.valueAsNumber); if (c !== null) setCelsius(c); }}/>;
    const fInput = <input type="number" value="32" oninput={e => { const f = toNumber(e.target.valueAsNumber); if (f !== null) setCelsius((f - 32) * 5 / 9); }}/>;
    display(<p>{cInput} °C = {fInput} °F</p>);
</script>
<script type="module" is="reactive">
    {
        if (document.activeElement !== cInput) cInput.value = String(Math.round(celsius * 10) / 10);
        if (document.activeElement !== fInput) fInput.value = String(Math.round((celsius * 9 / 5 + 32) * 10) / 10);
    }
</script>
```
`document` is captured once as a global, but `document.activeElement` is a live property read, so
the focus check works. The guard keeps a half-typed, unparseable value out of the mutable.
For a single input, `view()` is all you need — don't recreate controlled-input plumbing.

### e. Subscriptions and timers

```jsx
// React
useEffect(() => {
  const id = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(id);
}, []);
useEffect(() => {
  const onKey = e => setLastKey(e.key);
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []);
```
```js
// dataflow
const tick = observe(notify => {
    const id = setInterval(() => notify(Date.now()), 1000);
    return () => clearInterval(id);
}, Date.now());
const lastKey = events(window, 'keydown', e => e.key, '');
```
(For a per-frame clock just use `now`.) Svelte `onMount(() => { …; return cleanup })` and Vue
`onMounted`/`onUnmounted` translate the same way.

### f. Context / global store / reducer

```jsx
// React
const ThemeContext = createContext('light');
function reducer(state, action) { switch (action.type) { case 'inc': return {...state, n: state.n + 1}; default: return state; } }
const [state, dispatch] = useReducer(reducer, {n: 0});
```
```js
// dataflow — state block; anything anywhere can read `theme`/`state` and call `dispatch`
const theme = view(<select><option>light</option><option>dark</option></select>);
// ---
const reducer = (state, action) => action.type === 'inc' ? {...state, n: state.n + 1} : state;
const state = mutable({n: 0});
const dispatch = action => state.update(s => reducer(s, action));
// ---
{ document.documentElement.dataset.theme = theme; }
```

## 4. Components, reuse, widgets and live DOM state

- **Presentational components → functions**:
  ```js
  const card = (title, body) => <section class="card"><h3>{title}</h3>{body}</section>;
  // ---
  card('Stats', <p>{visible.length} items</p>)
  ```
  Functions must be called, not used as tags. Keep them pure (args in, nodes out). A helper's JSX
  is reused only when called during its *own* block's run; called from another block (as above) it
  builds fresh DOM each time (the `<p>` passed in is still reused). If a helper's elements hold
  state, define it in the block that calls it.
- **Component-local state for N instances** (e.g. each row has its own "expanded" flag):
  lift it into data. `const expanded = mutable(new Set()); const toggleRow = id => expanded.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });`
  then `expanded.has(row.id) ? … : …` in the list block.
- **Self-contained widgets repeated on a page** (comment box, like button): make each an
  **island** (`<div is="reactive-island">`), each with its own scope. When a server template stamps
  out N islands, the HTTP intercept transforms that server-generated HTML per request — the
  structure is known at transform time even though it was dynamic on the server.
- **Tiny leaf widgets with purely local UI state** can use plain closures + DOM (no graph):
  ```js
  const toggleButton = label => { const b = <button aria-pressed="false" onclick={() => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))}>{label}</button>; return b; };
  ```
  Such state survives the enclosing block's re-runs (the element is reused), unless its call
  site, key or order changes.
- **Live DOM state and transitions.** A re-running block reuses its elements (positional JSX), so
  focus/caret/typed text, inner scroll, `<details open>` and media survive, and a changed `class`
  or `style` runs its CSS transition. A changed call site, key or order gives fresh DOM (mount
  `@keyframes` replay only then). Svelte `transition:`/Vue `<Transition>` enter/leave animations
  have no direct equivalent; for those, render the element once and mutate it imperatively:
  ```html
  <div id="panel" class="panel">…</div>        <!-- static, styled with a CSS transition -->
  <script type="module" is="reactive">
      { document.getElementById('panel').classList.toggle('open', isOpen); }
  </script>
  ```
  (The audio tutorial toggles `hidden` this way.)
- **Imperative widgets** (React `useRef` + `useEffect` mount: Leaflet/Mapbox, CodeMirror/Monaco,
  Chart.js, D3 with measurement). `display()` is buffered until a microtask after the run, so a new node
  created with JSX/`display` in a block is not attached yet while that block runs, nor guaranteed
  to be laid out when a dependent block runs — measuring, focusing or handing it to a library that needs a sized
  container can fail. Preferred idiom: a static container in the HTML, the widget created once
  as a top-level output with teardown, and updates from separate blocks calling its methods:
  ```html
  <div id="map" style="height: 400px"></div>
  <script type="module" is="reactive">
      import L from "https://esm.run/leaflet";
  </script>
  <script type="module" is="reactive">
      const map = Object.assign(L.map(document.getElementById('map')),
          {[Symbol.dispose]() { this.remove(); }});
  </script>
  <script type="module" is="reactive">
      { map.setView([lat, lng], zoom); }             // re-runs on lat/lng/zoom; never rebuilds map
  </script>
  ```
  Libraries that *return* a node (Observable Plot, vgplot) can simply be displayed instead.
- **Third-party UI components.** React component libraries (MUI, Radix, shadcn, Headless UI)
  can't be used. Use plain-DOM libraries or **Web Components** (e.g. Shoelace), which fit jsx2dom:
  attributes go through `setAttribute`; events use the exact name after `on`, including custom
  ones (`onsl-change={…}`). Rich props (objects/arrays) must be set as properties, since jsx2dom
  never assigns properties: `const grid = <x-grid/>; grid.items = rows;`. `view()` works with any
  element that has `.value` and fires `input`, e.g. form-associated custom elements.

## 5. Routing

Prefer real pages: dataflow is HTML-first and each page is transformed (and cached) independently,
so an MPA with links is the natural fit. For in-page views, make the route a source and toggle
static sections:
```js
const route = events(window, 'hashchange', () => window.location.hash.slice(1) || 'home',
                     window.location.hash.slice(1) || 'home');
// ---
{ for (const s of document.querySelectorAll('[data-route]')) s.hidden = s.dataset.route !== route; }
```
```html
<nav><a href="#home">Home</a> <a href="#about">About</a></nav>
<section data-route="home">…blocks…</section>
<section data-route="about" hidden>…blocks…</section>
```
All sections' blocks exist in the graph (structure is static); only visibility changes. Route
params: derive them in a block (`const id = route.split('/')[1];`) and fetch from that.

## 6. When structure isn't knowable at transform time

The graph is the set of reactive scripts present in the HTML when it is transformed. It cannot
grow at runtime; reactive scripts inserted by client JS are inert. Options, in order of preference:
1. **Dynamic data, static structure** — almost always the answer. A variable number of
   items/cards/charts is a `.map` inside one block over data in a mutable or fetched value.
2. **Server-side structure + HTTP intercept** — generate the HTML (with blocks/islands) on the
   server per user/request; `ReactiveHandler` transforms it on the way out. Cacheable per URL.
3. **Fragments over the wire** — HTMX/Unpoly endpoint returns an island; the endpoint sits behind
   `ReactiveHandler`, so the fragment arrives already transformed.
4. **Imperative sub-trees** — inside a block, build/update DOM for genuinely open-ended structures
   (editors, drag-and-drop canvases) with plain JS, feeding results back via actions.
5. **In-browser transform** — `DOMTransformer` on client-generated HTML (ships acorn; dev only).

Say clearly when a React/Svelte/Vue feature relies on runtime-created component trees with their
own reactive state, and pick one of the above rather than forcing it.

## 7. Porting checklist

- [ ] Static markup is plain HTML; blocks only where something changes.
- [ ] State blocks contain `mutable`s + actions, no changing inputs.
- [ ] Inputs via `view()`; forms uncontrolled; `value={x}` only where `x` should overwrite typing.
- [ ] Derived values inlined where used (named `const` block only if shared); no dependency arrays.
- [ ] Top-level names are deliberate (they are page-global); single-use values inlined, needed
      locals in a `{}` scope; blocks evaluate to their elements, `display()` used sparingly.
- [ ] Effects are `{}` blocks; cleanup via AbortController / `Symbol.dispose` / `observe` / `invalidator`.
- [ ] No `<Component/>`, `className`, `onClick`, `&&` on a number, `ref`, TS syntax, `export`, `import React`; `key` on stateful list rows.
- [ ] No rAF/setInterval animation loops; use `now`/generators.
- [ ] Top-level names unique across the page (prefix or `{}`-scope locals).
- [ ] Errors caught inside blocks; fetches `.catch`.
- [ ] Initial/loading state: React renders initial state before effects resolve; dataflow waits
      (a block depending on a promise renders nothing until it resolves, and keeps old content
      while the next one is pending). If the UI must show an initial or loading state, use the
      async-generator form that yields it first (patterns.md §6).
- [ ] Content needed in the initial HTML (SEO, no-JS, first paint) is static/server-rendered
      markup around the blocks — block output is client-rendered only.
- [ ] Served through `ReactiveHandler` (or built), with an import map for the runtime and libraries.
