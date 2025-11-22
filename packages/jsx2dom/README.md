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