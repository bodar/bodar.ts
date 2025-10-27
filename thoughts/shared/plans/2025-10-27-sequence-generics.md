# Sequence Function Advanced Type Chaining Implementation Plan

## Overview

Refactor the `sequence` function in totallylazy to use TypeScript 4.0+ recursive conditional types for unlimited type-safe transducer chaining, eliminating the need for 7 explicit overloads while maintaining full type safety and ensuring JSR doesn't reject the package for slow types.

## Current State Analysis

The `sequence` function currently uses 7 explicit overloads (lines 43-49 in `/home/dan/Projects/bodar.ts/packages/totallylazy/src/collections/Sequence.ts`) to ensure type safety when chaining transducers. Each overload tracks the type transformation through up to 5 transducers, with a final variadic overload that loses type safety (returns `any`).

### Key Discoveries:
- Current implementation has 6 type-safe overloads plus 1 catch-all with `any` types
- Transducer interface is a simple function type: `(iterable: Iterable<A>) => Iterable<B>`
- The Sequence class stores transducers as `readonly Transducer<any, any>[]` at runtime
- Tests verify type inference works correctly with chained transducers

## Desired End State

A single function signature for `sequence` that:
- Provides unlimited transducer chaining with full type safety
- Correctly validates that each transducer's output matches the next's input at compile time
- Maintains backward compatibility with existing code
- Compiles efficiently without causing JSR to reject for slow types
- Passes all existing tests without modification

### Verification:
- TypeScript compilation succeeds with no errors
- All existing tests pass unchanged
- JSR score remains at 100%
- CircleCI build completes successfully

## What We're NOT Doing

- Modifying the Sequence class implementation
- Changing the Transducer interface
- Updating any other files that use similar overload patterns (compose, parser, etc.)
- Modifying any tests
- Changing the runtime behavior of sequence

## Implementation Approach

Use TypeScript's recursive conditional types with variadic tuple types to validate transducer chaining at compile time. The implementation will have a type-safe public signature and a separate implementation signature with `any` types, as recommended in the research.

## Phase 1: Implement Recursive Type Validation

### Overview
Replace the 7 overloads with a single signature using recursive conditional types that validate each transducer's type compatibility.

### Changes Required:

#### 1. Update Sequence.ts Type Definitions
**File**: `/home/dan/Projects/bodar.ts/packages/totallylazy/src/collections/Sequence.ts`
**Changes**: Replace lines 43-49 with new type definitions and single signature

```typescript
// Helper type to extract the first element type
type Head<T extends any[]> = T extends [infer H, ...any] ? H : never;

// Recursive type to validate transducer chaining
type ValidateTransducers<
  T extends Transducer<any, any>[],
  Cache extends Transducer<any, any>[] = []
> = T extends []
  ? Cache
  : T extends [infer Last]
  ? Last extends Transducer<any, any>
    ? [...Cache, Last]
    : never
  : T extends [infer First, ...infer Rest]
  ? First extends Transducer<infer A, infer B>
    ? Rest extends Transducer<any, any>[]
      ? Head<Rest> extends Transducer<infer C, any>
        ? B extends C  // Output of First must match input of Next
          ? ValidateTransducers<Rest, [...Cache, First]>
          : never  // Type mismatch - compilation error
        : never
      : never
    : never
  : never;

// Extract the input type of the first transducer
type FirstInput<T extends Transducer<any, any>[]> =
  T extends [Transducer<infer A, any>, ...any] ? A : never;

// Extract the output type of the last transducer
type LastOutput<T extends Transducer<any, any>[]> =
  T extends [...any, Transducer<any, infer Z>] ? Z : never;

// Single overload for no transducers
export function sequence<A>(a: Iterable<A>): Sequence<A>;
// Single signature with full type validation for transducers
export function sequence<S, T extends Transducer<any, any>[]>(
  source: Iterable<S>,
  ...transducers: T extends [] ? [] : S extends FirstInput<T> ? ValidateTransducers<T> : never
): Sequence<T extends [] ? S : LastOutput<T>>;
// Implementation signature
export function sequence(source: Iterable<any>, ...transducers: readonly Transducer<any, any>[]): Sequence<any> {
    if (source instanceof Sequence) {
        return new Sequence<any>(source.source, flatten([...source.transducers, ...transducers]));
    }
    return new Sequence<any>(source, flatten(transducers));
}
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Type checking passes: `./run check`
- [x] All tests pass: `./run test packages/totallylazy/test/collections/Sequence.test.ts`
- [x] Build succeeds: `./run build`
- [x] Verify type inference still works correctly by checking test file compiles

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [ ] Monitor CircleCI build: Watch the build at https://app.circleci.com/pipelines/github/bodar/bodar.ts
- [ ] All build steps pass: Review build logs if any failures occur
- [ ] If build fails: Fix issues, commit, push, and verify build succeeds before proceeding

#### Post-deployment Verification (Production):
After build succeeds:
- [ ] Check JSR score remains at 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`
- [ ] Verify JSR hasn't rejected package for slow types: Check JSR page loads without errors
- [ ] Confirm package is still available on JSR: Verify https://jsr.io/@bodar/totallylazy shows latest version

---

## Testing Strategy

### Type Inference Tests:
- Existing test in `Sequence.test.ts` will verify type inference still works
- The test at line 14 `const t = sequence(original, f, m);` should compile with correct types
- Variable `t` should be inferred as `Sequence<string>`

### Compilation Performance:
- Monitor TypeScript compilation time during `./run check`
- Check JSR doesn't reject for slow types after deployment

### Local Verification (Pre-commit):
1. Run type check: `./run check`
2. Run specific test: `./run test packages/totallylazy/test/collections/Sequence.test.ts`
3. Build the project: `./run build`
4. Verify no TypeScript errors in IDE

### Build Verification (After commit/push):
1. Monitor CircleCI build
2. Verify all steps pass
3. Check for any TypeScript performance warnings

### Production Verification (After build succeeds):
1. Check JSR score: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`
2. Verify package page loads: https://jsr.io/@bodar/totallylazy
3. Confirm no "slow types" rejection from JSR

## Performance Considerations

- Recursive type depth is limited to ~50-1000 levels depending on complexity
- For typical usage (2-10 transducers), performance impact should be negligible
- JSR may reject if type checking becomes too slow
- Monitor compilation time and JSR feedback closely

## Migration Notes

No migration needed - the change is backward compatible. All existing code using `sequence` will continue to work with improved type safety for longer chains.

## References

- Original research: `thoughts/shared/research/2025-10-27-sequence-transducer-type-chaining.md`
- Current implementation: `/home/dan/Projects/bodar.ts/packages/totallylazy/src/collections/Sequence.ts:43-55`
- Test file: `/home/dan/Projects/bodar.ts/packages/totallylazy/test/collections/Sequence.test.ts:10-14`