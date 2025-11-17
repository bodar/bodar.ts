# @bodar/dataflow

A reactive dataflow library inspired by Observable Framework's reactive cells.

## Key Differences

- **Library, not framework**: Individual pieces are usable independently
- **HTML-based**: Designed for HTML reactive code blocks, not markdown
- **Runtime flexible**: Works at build time, in service workers, at the edge (Cloudflare Workers), or on the server

## Status

**Early days** - API will change. Currently focusing on the core dataflow engine.

## Vision

The plan is to build an HTML parser that:
- Identifies reactive code blocks in HTML
- Performs topological sorting of dependencies
- Uses the `Dataflow` class to construct the reactive graph
- Inserts cell markers similar to Observable Framework

This enables static generation, edge computing, or dynamic server middleware - all using the same reactive primitives.

## Usage

```typescript
import { Dataflow } from '@bodar/dataflow';

const dataflow = new Dataflow();
const { nodeA } = dataflow.define(() => 1, 'nodeA');
const { nodeB } = dataflow.define((nodeA: number) => nodeA * 2);

for await (const value of nodeB) {
  console.log(value); // 2
}
```

## What's Next

- HTML rewriter for extracting reactive blocks
- Cell markers and templating
- Build-time and runtime integration examples
