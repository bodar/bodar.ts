# Dataflow API Comparison: Observable Framework vs @bodar/dataflow

## Summary

The dataflow package implements the **most frequently used** Observable Framework reactivity primitives. The main gap is lifecycle management (`invalidation`).

## API Comparison

### Already Implemented (High Usage)

| Function | Framework Usage | Implementation | Notes |
|----------|-----------------|----------------|-------|
| `view()` | **109 uses** | `view.ts` | Combines input + display |
| `display()` | **60 uses** | `display.ts` | Value collector for rendering |
| `resize()` | **57 uses** | `resize.ts` | Responsive container with ResizeObserver |
| `Generators.input()` | **20 uses** | `input.ts` | DOM element → AsyncIterator |
| `Generators.observe()` | **10 uses** | `observe.ts` | Callback → AsyncIterator |
| `Mutable` | **3 uses** | `mutable.ts` | Reactive value with EventTarget |

### Missing (Prioritized by Usage)

| Priority | Function | Usage | Description |
|----------|----------|-------|-------------|
| 1 | `invalidation` | **18 uses** | Promise for cleanup when block re-runs |
| 2 | `visibility()` | **7 uses** | Promise resolving when element visible |
| 3 | `Generators.width()` | **4 uses** | Element width as async generator |
| 4 | `Generators.now()` | **3 uses** | Continuous Date.now() generator |
| 5 | `Generators.queue()` | **2 uses** | Like observe but queues (no drops) |
| 6 | `Generators.dark()` | **2 uses** | Dark mode preference generator |

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

## Dispose Pattern Comparison

### Observable Framework Approach

```javascript
// Framework observe.js
export async function* observe(initialize) {
  const dispose = initialize((x) => { /* notify */ });
  try {
    while (true) { yield ... }
  } finally {
    if (dispose != null) dispose();
  }
}
```

The Observable **Runtime** calls `generator.return()` when:
1. A variable is deleted/redefined
2. The `invalidation` promise resolves
3. Code block is re-run

### Current Dataflow Approach

```typescript
// observe.ts - no dispose support
export async function* observe<T>(init: (notify: (e: T) => any) => any, value?: T): AsyncIterator<T> {
  init((v => resolve(value = v)));  // init return value ignored
  // No finally block for cleanup
}
```

### Recommendation

Add dispose support to `observe()`:

```typescript
export async function* observe<T>(
  init: (notify: (e: T) => any) => (() => void) | void,
  value?: T
): AsyncIterator<T> {
  const dispose = init((v => resolve(value = v)));
  try {
    // ... existing yield logic
  } finally {
    dispose?.();
  }
}
```

## When Cleanup Actually Matters

Event listeners on DOM elements don't cause true memory leaks in modern browsers if the element is removed. However, these resources **do** leak:

- `ResizeObserver` / `MutationObserver` - must call `.disconnect()`
- `setInterval` / `setTimeout` - must call `clearInterval()` / `clearTimeout()`
- WebSocket / EventSource connections - must call `.close()`
- Global event listeners (`window.addEventListener`) - must call `removeEventListener()`

## Source References

- Observable Framework `observe.js`: `framework/src/client/stdlib/generators/observe.js`
- Observable Framework `resize.ts`: `framework/src/client/stdlib/resize.ts`
- Observable Runtime: `observablehq/runtime` on GitHub - `src/runtime.js` contains `variable_return()` for generator cleanup
- Test file: `packages/dataflow/test/api/generator-return.test.ts`
