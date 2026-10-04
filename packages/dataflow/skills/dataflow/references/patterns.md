# Patterns and idioms

Distilled from `packages/dataflow/docs/*.html` and `docs/examples/*.html` (todo, comments,
memory, canvas-tutorial, svg-tutorial, audio-tutorial, cross-filter-flights). Every snippet is a
set of `<script type="module" is="reactive">…</script>` blocks; `// ---` separates blocks.

## Contents
1. Page anatomy
2. Inputs and controls
3. State + actions (CRUD lists, filters)
4. Forms
5. Conditional UI
6. Data fetching (loading, errors, abort, debounce)
7. Async initialisation and libraries
8. Time, animation and game loops
9. Canvas
10. SVG
11. Charts and third-party DOM (Observable Plot, Mosaic cross-filter)
12. External resources (Web Audio, WebSocket, timers, observers)
13. Persistence and URL state
14. Interop with static HTML

---

## 1. Page anatomy

- Normal HTML document; static content stays static. Each block sits where its output appears.
- Tiny blocks: a label/readout block next to the `view()` it reads, even if declared later.
- Constants can live at the end of a section; order is irrelevant.
- Prefix names per section on large pages — one namespace per page/island.
```html
<div class="control-row">
    <script type="module" is="reactive"><label>width {canvasWidth}</label></script>
    <script type="module" is="reactive">const canvasWidth = view(<input type="range" min="200" max="600" value="400"/>);</script>
</div>
```

## 2. Inputs and controls

```js
const name   = view(<input type="text" placeholder="Name"/>);          // string
const size   = view(<input type="range" min="1" max="100" value="50"/>); // number
const on     = view(<input type="checkbox" checked/>);                 // boolean
const color  = view(<input type="color" value="#3b82f6"/>);             // string
const mode   = view(<select><option>linear</option><option selected>log</option></select>); // string
const when   = view(<input type="date"/>);                              // Date | null
const file   = view(<input type="file" accept=".csv"/>);                // File (waits until chosen)
```
- `<select>` gives strings; `Number(x)` before maths.
- Label + input: `<label>Size <script …>size</script></label>` or a JSX label block.
- Custom element placement: `const el = <input/>; const v = input(el);` then render `el` in
  another block.
- Transform the value: `input(el, 'input', el => el.value.trim().toLowerCase())`.
- Button press stream: `const clicks = events(btn, 'click', () => Date.now())` (non-`undefined`!).
- Radio group → mutable (todo filter):
```js
const filter = mutable(v => v);
display(<div class="filters">
    <label><input type="radio" name="f" checked={true} onchange={() => filter.value = v => v}/>All</label>
    <label><input type="radio" name="f" onchange={() => filter.value = v => !v.completed}/>Active</label>
    <label><input type="radio" name="f" onchange={() => filter.value = v => v.completed}/>Done</label>
</div>)
```
(This block depends on nothing that changes, so the radios keep their checked state.)

## 3. State + actions (CRUD)

```js
const todos = mutable([{id: "todo-0", name: "Eat", completed: true}]);
const addTodo = name => todos.update(xs => [...xs, {id: crypto.randomUUID(), name, completed: false}]);
const deleteTodo = id => todos.update(xs => xs.filter(t => t.id !== id));
const updateTodo = todo => todos.update(xs => xs.map(t => t.id === todo.id ? todo : t));
// ---
const filtered = todos.filter(filter);           // derived (todos and filter are plain values here)
display(<p>{filtered.length} task{filtered.length !== 1 ? 's' : ''} remaining</p>);
display(<ul>{filtered.map(todo =>
    <li class={todo.completed ? 'done' : ''}>
        <input type="checkbox" checked={todo.completed}
               onclick={() => updateTodo({...todo, completed: !todo.completed})}/>
        {todo.name}
        <button onclick={() => deleteTodo(todo.id)}>✕</button>
    </li>)}</ul>);
```
- The state block has no changing inputs (only globals like `crypto`), so it never resets.
- The list re-renders wholesale on each change (no keys). DOM-only edits (contenteditable text)
  must be copied into state before an update re-renders them away (`todo.html` reads `innerText`
  in its handlers and commits on `onblur`).
- Bounded buffer: `samples.update(a => { a.push(s); return a.length > max ? a.slice(-max) : a; })`.
- Split count / list / form into separate blocks for finer re-rendering (comments.html).

## 4. Forms

Uncontrolled inputs read on submit; the form block depends only on actions, so it renders once and
keeps typed text and focus:
```jsx
<form onsubmit={e => {
    e.preventDefault();
    const data = new FormData(e.target);
    addComment(data.get('author'), data.get('text'));
    e.target.reset();
}}>
    <input name="author" placeholder="Your name"/>
    <textarea name="text" rows="3" required></textarea>
    <button type="submit">Post</button>
</form>
```
Live validation: `const email = view(<input type="email"/>);` then a separate block
`email.includes('@') ? '' : <p class="error">Invalid email</p>`.

## 5. Conditional UI

```js
state === 'running'
    ? <button onclick={() => context.suspend()}>Stop</button>
    : <button onclick={() => context.resume()}>Play</button>
```
- Always ternary with `''` for "nothing" — never `&&`.
- Toggle static HTML with `hidden`: `<div class="note" hidden={mode !== 'advanced'}>…</div>`, or
  imperatively from an effect block: `document.getElementById('filter-q').hidden = !showQ;`.
- Multi-way: object lookup `({list: listView, grid: gridView})[layout]` where each is a node built
  in its own block, or a small function returning JSX.

## 6. Data fetching

Simplest — a promise-valued declaration; dependents wait and receive the resolved value:
```js
const repo = fetch('https://api.github.com/repos/octocat/Hello-World').then(r => r.json());
// ---
`${repo.name}: ${repo.description}`
```
Top-level await (reads sequentially):
```js
const response = await fetch(url);
const data = await response.json();
```
Re-fetch on input + cancel stale requests (AbortController is aborted when `query` changes):
```js
const query = view(<input type="search" value="a"/>);
// ---
const controller = new AbortController();
const results = fetch(`/api/search?q=${encodeURIComponent(query)}`, {signal: controller.signal})
    .then(r => r.json())
    .catch(e => ({error: e.name === 'AbortError' ? null : e.message, items: []}));
// ---
results.error ? <p class="error">{results.error}</p> : <ul>{results.items.map(i => <li>{i.title}</li>)}</ul>
```
Loading state + debounce with an async generator *object*. When `query` changes the block re-runs:
the old generator is replaced (its later values are ignored) and the `controller` output is aborted,
which is what actually stops the stale debounce/fetch:
```js
const controller = new AbortController();
const search = (async function* () {
    yield {loading: true, items: []};
    await new Promise(r => setTimeout(r, 300));           // debounce
    if (controller.signal.aborted) return;
    try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {signal: controller.signal});
        yield {loading: false, items: await r.json()};
    } catch (e) { if (e.name !== 'AbortError') yield {loading: false, error: e.message, items: []}; }
})();
// ---
search.loading ? <p>Loading…</p> : search.error ? <p>{search.error}</p> : <ul>{search.items.map(i => <li>{i}</li>)}</ul>
```
Always catch: a rejected promise silently freezes the block and everything downstream.

## 7. Async initialisation and libraries

```js
import * as Plot from "@observablehq/plot";          // own block; Plot is now shared
// ---
const vg = await import('@uwdata/vgplot');           // dynamic import also fine
const coord = vg.coordinator();
await coord.exec(vg.loadParquet('flights', 'flights.parquet'));
```
Bare specifiers need an import map (`"@observablehq/": "https://esm.run/@observablehq/"`) or full
URLs (`import * as d3 from "https://esm.run/d3"`). Dependents wait for the async block.

## 8. Time, animation and game loops

No `requestAnimationFrame`, no `setInterval` loops — the graph ticks per frame.
```js
`The current time is ${new Date(now).toLocaleTimeString("en-GB")}.`     // re-runs every frame
```
```js
const frame = function* () { for (let i = 0; ; ++i) yield i; };       // per-frame counter
```
```js
const seconds = async function* () {                                   // self-timed
    for (let s = 0; ; ++s) { yield s; await new Promise(r => setTimeout(r, 1000)); }
};
```
Tween 0 → `target` over 500 ms, restarting whenever `target` changes (a generator *object* is
closed by invalidation when the block re-runs):
```js
const tweened = (function* () {
    const start = performance.now();
    for (let t = 0; t < 1;) { t = Math.min(1, (performance.now() - start) / 500); yield target * t; }
})();
```
Effect loop writing into state (memory.html): wrap in `{}` so locals stay private.
```js
{
    const delta = now - timing.lastTime;       // timing = {lastTime: performance.now()} — a plain object, like useRef
    timing.lastTime = now;
    addSample({fps: delta > 0 ? 1000 / delta : 0}, 200);
}
```
Game loop — keep input in a non-reactive object and step state inside one long-lived generator
(if the generator depended on changing values it would be re-created and reset):
```js
const keys = new Set();
{
    document.addEventListener('keydown', e => keys.add(e.key));
    document.addEventListener('keyup', e => keys.delete(e.key));
}
// ---
const game = function* () {
    let p = {x: 150, y: 100};
    while (true) {
        if (keys.has('ArrowLeft')) p = {...p, x: p.x - 3};
        if (keys.has('ArrowRight')) p = {...p, x: p.x + 3};
        yield p;
    }
};
// ---
<svg viewBox="0 0 300 200" width="300" height="200"><circle cx={game.x} cy={game.y} r="10"/></svg>
```
Discrete events (key presses, clicks) that must all count: accumulate in a mutable action
(`onclick={() => score.update(s => s + 1)}`) — streams are latest-wins per frame.

## 9. Canvas

Create in one block (`display` returns the element), draw in another wrapped in `{}`:
```js
const canvas = display(<canvas width={width} height={Math.round(width / 3)}></canvas>);
// ---
{
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);    // always clear/fill fully — pixels persist
    ctx.fillStyle = fillStyle;
    ctx.fillRect(x, y, w, h);
    ctx.setLineDash([]);                                  // reset any state you changed
}
```
The draw block re-runs when any parameter changes; the canvas block only when its size changes
(a new element). Keep canvas blocks dependent only on attribute values.

## 10. SVG

One single-expression JSX block; rebuild the whole tree each change (cheap):
```jsx
<svg viewBox={`0 0 ${w} ${h}`}>
    <rect x={x} y={y} width={rw} height={rh} rx={r} fill={fill} stroke={stroke} stroke-width={sw}/>
    <path d={linePath} fill="none" stroke="#888"/>
    <text x="10" y="20" font-size="12">{label}</text>
</svg>
```
Derived strings in their own block so several views share them:
```js
const linePath = `M ${x0},${y0} L ${x1},${y1}`;
```
Kebab-case presentation attributes; `href` not `xlink:href`.

## 11. Charts and third-party DOM

Anything returning a DOM node can be displayed or used as a JSX child:
```js
<div class="chart">{Plot.plot({width, height: width / 3, marks: [Plot.lineY(samples, {y: "fps"})]})}</div>
```
Mosaic/vgplot cross-filtering happens *inside* Mosaic (`vg.Selection.crossfilter()` +
`filterBy`/`intervalX({as: brush})`); dataflow only supplies `vg`, `width` and displays the result:
```js
const brush = vg.Selection.crossfilter();
const makePlot = column => vg.plot(
    vg.rectY(vg.from("flights", {filterBy: brush}), {x: vg.bin(column), y: vg.count()}),
    vg.intervalX({as: brush}), vg.width(width), vg.height(width / 3));
display(vg.vconcat(makePlot("delay"), makePlot("time"), makePlot("distance")));
```
Rebuilding on `width` change resets library-internal state (brush selection) — accept it or
avoid `width` there. For a dataflow-native cross-filter: one `mutable` per selection, written by
chart event handlers, read by all chart blocks.

## 12. External resources

Let the resource be the source of truth; wrap its events with `events`:
```js
const context = new AudioContext();
context.suspend();
const state = events(context, 'statechange', () => context.state, context.state);
```
Re-create one-shot resources when inputs change and clean up the old via a custom rule:
```js
{invalidator.add(value => value instanceof AudioNode, value => value.disconnect());}
// ---
const oscillator = new OscillatorNode(context, {type: oscillator_type});
oscillator.connect(filter);
if (state === 'running') oscillator.start();
```
High-frequency params: write directly in `oninput`, use the `view` value only for display —
avoids rebuilding the node per slider move:
```js
const freq = view(<input type="range" min="20" max="2000" value={oscillator.frequency.value}
                         oninput={ev => oscillator.frequency.value = ev.target.value}/>);
```
Per-frame data from a resource: zero-arg generator function output (other blocks see each yielded
value):
```js
function* waveform() {
    const data = new Uint8Array(analyser.frequencyBinCount);
    while (state === 'running') { analyser.getByteTimeDomainData(data); yield data; }
}
```
WebSocket / EventSource / timers / observers — `observe` with zero-arg cleanup:
```js
const message = observe(notify => {
    const ws = new WebSocket(url);
    ws.onmessage = e => notify(JSON.parse(e.data));
    return () => ws.close();
}, null);
```
(`null` is the initial value so dependents run immediately — handle it; `undefined` would end the
stream.) To keep a history, push into a mutable from the handler instead of relying on every value
reaching dependents.
Generic disposable: `const sub = {…, [Symbol.dispose]() { …cleanup… }};` as a top-level output.

## 13. Persistence and URL state

```js
const todos = mutable(JSON.parse(localStorage.getItem('todos') ?? '[]'));
// ---
{ localStorage.setItem('todos', JSON.stringify(todos)); }       // effect: runs on every change
```
```js
const params = new URLSearchParams(window.location.search);
const backend = params.get('backend') || 'local';
```
URL changes that should rebuild everything can simply navigate (`window.location.href = …`), as
cross-filter-flights does. For in-page routing see porting.md §Routing.

## 14. Interop with static HTML

A block can query and wire existing markup (renders nothing, so no slot):
```js
const radio = document.querySelector(`input[name="backend"][value="${backend}"]`);
if (radio) radio.checked = true;
```
Status via data attributes + CSS: `document.getElementById('chart').dataset.state = 'connected';`
with `#chart[data-state="connected"]::before { … }`.
Reactive values can fill a slot inside any static element: `<dd><script …>{state}</script></dd>`
(single JSX/expression block).
