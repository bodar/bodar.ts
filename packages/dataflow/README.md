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

Early days - 

- [x] Create Graph and Nodes
  - [X] Function parsing
    - [x] Detect dependencies / inputs
    - [x] Detect outputs
  - [x] Support event sources (converted in AsyncIterables)
  - [x] Support AsyncIterable / AsyncIterator
  - [x] Support promises
- [ ] HTML Processors
  - [ ] Script tag parsing
  - [ ] JSX support (converts to native DOM methods)
  - [ ] Topological sorter
  - [ ] Buffered version (linkedom / browser)
  - [ ] Streaming version (cloudflare / bun)
- [ ] Fetch / Service Worker middleware

## Vision

One day this could just be built into the browser (as single attribute)

## Usage

```typescript
import { Graph } from '@bodar/dataflow';

const graph = new Graph();
graph.define('constant', () => 1);
const { reactive } = graph.define((constant: number) => nodeA * 2);

for await (const value of reactive) {
  console.log(value); // 2
}
```
