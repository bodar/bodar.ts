# @bodar/jsx2dom

Extremely thin adapter to convert JSX/TSX to native DOM method calls. Works in the browser but also at the edge, server 
side or in unit tests using [linkedom](https://github.com/WebReflection/linkedom) without any global namespace pollution.

## Setup

### tsconfig.json

```json5
{
  "compilerOptions": {
    // jsx2dom
    "jsx": "react",
    "jsxFactory": "jsx.createElement",
    "jsxFragmentFactory": "null"
  }
}
```

## Usage

### Client Side

```tsx
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";

// If you want this to be a different name also change the tsconfig jsxFactory
const jsx = new JSX2DOM();
const name = 'Dan'
document.body.appendChild(<div class="firstname" title={`Hello ${name}`}>{name}</div>);
```

### Edge, Server Side or in a Unit Test

```tsx
import {parseHTML} from "linkedom";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";

const html = parseHTML('...');
const jsx = new JSX2DOM(html);
const name = 'Dan'
html.document.body.appendChild(<div class="firstname" title={`Hello ${name}`}>{name}</div>);
```
## PositionalJSX: re-render without losing DOM state

`JSX2DOM` builds new DOM every time. If you re-run the same code (to show new data), every element is replaced, and
whatever the browser kept on it is lost: focus, caret, typed text, scroll position, an open `<details>`, a canvas's
drawing, a running transition.

`PositionalJSX` extends `JSX2DOM` so that re-running code gets **last run's element made at the same place**, and only
what the JSX changed since then is written to it:

- **The same place** is the JSX's call site (where it is in the source), inside the same parent, plus its `key` (or,
  without one, its order among uses of that call site there).
- A different call site in a spot (a conditional switching branch) builds fresh DOM for that spot only.
- `key` tells list items apart (`{items.map(i => <li key={i.id}>…</li>)}`); it is never written to the DOM.
  Change a key to get fresh DOM on purpose.
- Handlers are stable: an element keeps one listener per event, and a new closure just replaces the current handler.
- Attributes are diffed against last run's JSX, not the DOM, so anything the user or code changed that the JSX didn't
  touch survives.

### It needs compiled JSX

Positional identity needs two things TypeScript's classic `jsxFactory` transform can't produce: a call site for each
element, and children as functions (so a parent is claimed before its children run). So the JSX is compiled to
`jsx.element(site, tag, attributes, ...children)` calls:

- **In [@bodar/dataflow](https://jsr.io/@bodar/dataflow) reactive blocks** this is automatic: every block's JSX is
  positional.
- **In your own modules**, compile the JSX with dataflow's `transformModuleJSX(js, id)` after stripping TypeScript
  (keeping the JSX). For example as a Bun plugin:

```ts
import type {BunPlugin} from "bun";
import ts from "typescript";
import {transformModuleJSX} from "@bodar/dataflow/jsx-transform/module.ts";

export const positionalJsx: BunPlugin = {
    name: "positional-jsx",
    setup(build) {
        build.onLoad({filter: /\/ui\/[^/]+\.tsx$/}, async ({path}) => {
            const {outputText} = ts.transpileModule(await Bun.file(path).text(),
                {fileName: path, compilerOptions: {jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext}});
            return {contents: transformModuleJSX(outputText, path), loader: "js"};
        });
    },
};
```

Use it in `Bun.build({plugins: [positionalJsx]})`, and for `bun test` register it with `Bun.plugin(positionalJsx)` in a
preload. Keep `"jsxFactory": "jsx.createElement"` in tsconfig for type checking.

### Rendering

`wrap(render)` makes each call a *run*: inside it, JSX reuses last run's elements; JSX made outside a run (in an event
handler, a timer) is always fresh.

```tsx
import {PositionalJSX} from "@bodar/jsx2dom/PositionalJSX.ts";

// counter.tsx, compiled positionally as above
export const counter = (jsx: PositionalJSX, count: number, increment: () => void) =>
    <div>
        <input placeholder="Type here, then click"/>
        <button onclick={increment}>Clicked {count} times</button>
    </div>;

// main.ts
const render = new PositionalJSX().wrap((jsx, count: number) => counter(jsx, count, () => render(count + 1)));
document.body.append(render(0)); // later calls hand back the same <div>, <input> and <button>:
                                 // the typed text and the button's focus survive every click
```

Written by hand, the compiled form is just calls (sites are any number or string unique to the call site):

```ts
const render = new PositionalJSX().wrap((jsx, count: number) =>
    jsx.element(1, "p", {class: "count"}, "Clicked ", () => count, " times"));
const p = render(0);
render(1) === p; // true: only the count's text node changed
```

`createElement` is still there (inherited) and always builds fresh DOM.
