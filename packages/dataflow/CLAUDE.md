# Dataflow Development Guide

## Core Runtime API

- `view(element)` - displays input and returns reactive value. Often this is all you need.
- `display(element)` - renders to page. Single expressions in a reactive block implicitly display.
- `mutable(value)` - for state that flows back up the graph. Use sparingly.
- `input(element)` - turns elements with click/change/input events into observable generators.
- `event(target)` - turns anything with `addEventListener` into an observable generator.

See `src/api/` for other available functions.

## Tips for Reactive Blocks

These apply inside `<script type="module" is="reactive">`.

### Don't use `window` for state or functions

```javascript
// WRONG - pollutes global scope, bypasses reactivity
window.someFunction = () => 'Hello';

// RIGHT - implicitly added to shared reactive scope
const someFunction = () => 'Hello';
```

### `view()` is usually enough

```javascript
// WRONG - overcomplicating with mutable
const playing = mutable(false);
display(<input type="checkbox" onchange={() => playing.value = !playing.value}/>);

// RIGHT - view handles both display and state
const playing = view(<input type="checkbox"/>);
```

### Block statements create local scope

```javascript
// These are NOT shared with other blocks
{
    const x = 1;
    const y = 2;
}

// These ARE shared (top-level)
const x = 1;
const y = 2;
```

### Document order doesn't matter

Blocks are topologically sorted by dependencies, not document position. A block can reference variables defined later in the HTML.

### Promises and generators become values across blocks

```javascript
// Block 1
const data = fetch(url).then(r => r.json());

// Block 2 - no await needed
`Name: ${data.name}`
```

### Modelling solutions

Think of dataflows as separate layers rather than one big app with many UI components (the React mindset). Instead of managing complex state across components, slice the app into reactive flows:

1. Initial display loads starting state and renders
2. Complex workflows (e.g., "create new X") become separate flows triggered by events
3. Use the `event()` function to create generators from user actions
4. Each flow is more like a template with markup than a component with internal state

This avoids unnecessary UI components with redundant state management.

## Building and Testing

Run commands from the mono repo root (not inside `packages/dataflow`).

Start the test server at http://localhost:3000/ with `./run demo`.

## File Structure

- `src/` - Core transform-time classes (BaseGraph, PullNode, combineLast, SharedAsyncIterable)
- `src/api/` - Runtime APIs (view, mutable, display, etc.)
- `src/html/` - HTML transformation and node processing
- `docs/` - Documentation (read if in doubt)
- `docs/examples/` - Examples
- `test/` - Test files (read if in doubt)
