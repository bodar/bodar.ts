# Dataflow API Comparison: Observable Framework vs @bodar/dataflow

## Summary

The dataflow package implements the **most frequently used** Observable Framework reactivity primitives, including automatic resource cleanup via invalidation.

## API Comparison

### Already Implemented (High Usage)

| Function | Framework Usage | Implementation | Notes |
|----------|-----------------|----------------|-------|
| `view()` | **109 uses** | `view.ts` | Combines input + display |
| `display()` | **60 uses** | `display.ts` | Value collector for rendering |
| `width` | **57+4 uses** | `width.ts` | Container width as reactive value (replaces resize & Generators.width) |
| `Generators.input()` | **20 uses** | `input.ts` | DOM element → AsyncIterator |
| `Generators.observe()` | **10 uses** | `observe.ts` | Callback → AsyncIterator |
| `Mutable` | **3 uses** | `mutable.ts` | Reactive value with EventTarget |
| `invalidation` | **18 uses** | `PullNode.ts` | Auto-cleanup via AbortController/Symbol.dispose |
| `Generators.now()` | **3 uses** | `now.ts` | Continuous Date.now() generator |

### Missing (Prioritized by Usage)

| Priority | Function | Usage | Description |
|----------|----------|-------|-------------|
| 1 | `visibility()` | **7 uses** | Promise resolving when element visible |
| 2 | `Generators.queue()` | **2 uses** | Like observe but queues (no drops) |
| 3 | `Generators.dark()` | **2 uses** | Dark mode preference generator |

## Generator Lifecycle: When `return()` and `finally` Run

### Test Results

| Scenario | `return()` called? | `finally` runs? |
|----------|-------------------|-----------------|
| Finite generator completes normally | **No** | **Yes** (natural completion) |
| `break` in loop | **Yes** | **Yes** (via return) |
| `throw` in loop | **Yes** | **Yes** (via return) |
| `return` from function inside loop | **Yes** | **Yes** (via return) |
| Iterator abandoned (manual `.next()`) | **No** | **No** |

### Key Insight

The `finally` block runs in two different ways:
1. **Natural completion** - generator reaches end, `finally` runs as part of normal execution
2. **Via `return()`** - loop interrupted, runtime calls `return()` which triggers `finally`

The **only case where cleanup doesn't happen** is when you manually call `.next()` and then abandon the iterator without calling `.return()`.

### Ensuring Cleanup with a Wrapper

To guarantee `return()` is always called (enabling dispose patterns), use a wrapper:

```typescript
async function* withCleanup<T>(iter: AsyncIterator<T>): AsyncGenerator<T> {
    try {
        while (true) {
            const { value, done } = await iter.next();
            if (done) return;
            yield value;
        }
    } finally {
        await iter.return?.();
    }
}
```

Usage:
```typescript
for await (const v of withCleanup(myIterator)) {
    // ...
}
// return() always called - whether loop breaks, throws, or completes normally
```

## Invalidation Pattern Comparison

### Observable Framework Approach

```javascript
// User must await an invalidation promise
const controller = new AbortController();
invalidation.then(() => controller.abort());
```

The Observable **Runtime** calls `generator.return()` when:
1. A variable is deleted/redefined
2. The `invalidation` promise resolves
3. Code block is re-run

### Dataflow Approach

```typescript
// Automatic - just return a disposable value
graph.define('node', (input: number) => {
  const controller = new AbortController();
  // ... use controller.signal
  return controller;  // Auto-aborted when inputs change
});
```

The `PullNode.setValue()` method automatically invalidates the old value before setting a new one. It handles:
- `AbortController` - calls `.abort()`
- `Symbol.dispose` - calls it synchronously
- `Symbol.asyncDispose` - awaits it

This is simpler than Observable Framework's approach because:
1. No need to await a promise
2. No need to manually wire up cleanup
3. Just return a disposable value and it's handled automatically

## When Cleanup Actually Matters

Event listeners on DOM elements don't cause true memory leaks in modern browsers if the element is removed. However, these resources **do** leak:

- `ResizeObserver` / `MutationObserver` - must call `.disconnect()`
- `setInterval` / `setTimeout` - must call `clearInterval()` / `clearTimeout()`
- WebSocket / EventSource connections - must call `.close()`
- Global event listeners (`window.addEventListener`) - must call `removeEventListener()`

## Source References

- Observable Framework `observe.js`: `framework/src/client/stdlib/generators/observe.js`
- Dataflow width: `packages/dataflow/src/api/width.ts`
- Observable Runtime: `observablehq/runtime` on GitHub - `src/runtime.js` contains `variable_return()` for generator cleanup
- Dataflow invalidation: `packages/dataflow/src/PullNode.ts` - `invalidate()` function and `setValue()` method
- Lifecycle tests: `packages/dataflow/test/Graph.test.ts` - "invalidation" and "life cycle" describe blocks
