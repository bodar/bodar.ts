# @bodar/dataflow

A reactive dataflow library heavily inspired by Observable Framework but grounded in HTML not markdown.
Aiming to be an extremely light alternative to React, that natively supports static websites, server rendered,
edge rendered or client rendered content.

## Key Differences

- **Extremely Simple**: Add a single attribute to add reactivity to HTML.
- **Library, not framework**: a tiny library with independently useful components (the graph can be used for data processing outside of HTML)
- **HTML-based**: Designed to add reactivity to standard HTML rather than Markdown (though Markdown could easily be a plugin)
- **Runtime flexible**: The reactivity can be added at build time (static website), as middleware on the server or edge or finally as a service worker in the browser. 

## Status

Early days - DO NOT USE YET!

- [x] Create Graph and Nodes
  - [X] Function parsing
    - [x] Detect dependencies / inputs
    - [x] Detect outputs
  - [x] Support event sources (converted in AsyncIterables)
  - [x] Support AsyncIterable / AsyncIterator
  - [x] Support promises
- [x] HTML Processors
  - [x] Script tag parsing
  - [x] JSX support (converts to native DOM methods)
  - [x] Topological sorter
  - [ ] Buffered version (linkedom / browser)
  - [x] Streaming version (cloudflare / bun / browser via (htmlrewriter)[https://github.com/remorses/htmlrewriter])
- [ ] Fetch / Service Worker middleware

## Vision

One day this could just be built into the browser (as single attribute)

## Usage

### In HTML

Just add the attribute `reactive` to `<script>` tags, document order does not matter. Any top level constants declared in 
the block become outputs for other reactive script tags to depend on. Any undeclared variables in the script tags become 
dependencies / inputs for the script tag. The engine will topologically sort all the reactive script tags and build a 
reactive graph. If the script tag returns a DOM element, string or number it will be placed in the document.

```html
<p>This is our first reactive document.
    <script type="module" reactive>`The current time is ${new Date(now).toLocaleTimeString("en-GB")}.`</script>
</p>
<script type="module" reactive>
    <span style={`color: hsl(${(now / 10) % 360} 100% 50%)`}>Rainbow text!</span>
</script>
<script type="module" reactive>
    const now = function* () {
        while (true) {
            yield Date.now();
        }
    }
</script>
```

That's all folks!

### As a library

```typescript
import { Graph } from '@bodar/dataflow';

const graph = new Graph();
graph.define('name', () => 'Dan');
graph.define('time', function* () { while (true) { yield new Date().toLocaleTimeString("en-GB") }});
const { reactive } = graph.define('reactive', (name: string, time: string) => `Hello ${name}, the time is ${time}`);

for await (const value of reactive) {
  console.log(value);
}

// Prints
// Hello Dan, the time is 08:52:45
// Hello Dan, the time is 08:52:46
// Hello Dan, the time is 08:52:47
// ...
```
