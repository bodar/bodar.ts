# Transducer Parity Implementation Plan

## Overview

Implement 18 missing transducers in @bodar/totallylazy to achieve feature parity with the old totallylazy.js library, following the new architecture patterns.

## Current State Analysis

The new @bodar/totallylazy has 5 transducers (map, filter, flatMap, compose) while the old has 23. All new transducers follow a consistent pattern using a `transducer()` helper function, are sync-only, have introspection properties, and use JSDoc comments.

### Key Discoveries:
- All transducers use the `transducer()` helper from `Transducer.ts:20`
- Each has an interface extending `Transducer<A, B>` with branded type
- Generator functions yield transformed values
- Auto-generated `toString()` for self-description
- Comprehensive test coverage pattern established

## Desired End State

18 new transducers implemented with:
- Interface definitions with branded types
- Factory functions using `transducer()` helper
- Introspectable properties
- Type guards
- Comprehensive tests
- JSDoc comments
- JSR score maintained at 100%

### Success Verification:
- All pre-commit steps: `./run build` (automatically regenerates exports, runs type checking, and runs all tests)
- JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

**Note**: The `./run build` command performs all necessary pre-commit verification steps including:
1. Auto-generating package exports from source files
2. Type checking with TypeScript
3. Running all tests
This is the single command to use for verification instead of running check and test separately.

## What We're NOT Doing

- Async transducer support (sync-only for now)
- Transducers requiring external data structures (unique needs AVLTree - will use Set instead)
- Node.js specific features
- Backwards compatibility with old API

## Implementation Approach

Implement transducers in logical groups, starting with foundational ones that others depend on. Each transducer follows the established pattern with interface, factory, type guard, and tests. Commit and push after each group, verify build success and JSR score.

---

## Phase 1: Basic Collection Operations (take, drop, first, last)

### Overview
Implement fundamental collection limiting and extraction operations.

### Changes Required:

#### 1. Define Reducer Type
**File**: `packages/totallylazy/src/functions/Reducer.ts` (new file)
**Changes**: Create basic Reducer interface

```typescript
/** @module Reducer function type */

/**
 * A function that reduces values to an accumulator
 */
export interface Reducer<A, B> {
    (accumulator: B, value: A): B;
    toString(): string;
}
```

#### 2. TakeTransducer
**File**: `packages/totallylazy/src/transducers/TakeTransducer.ts` (new file)
**Changes**: Implement take transducer

```typescript
/** @module Take first N elements from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface TakeTransducer<A> extends Transducer<A, A> {
    readonly count: number;
    readonly [Transducer.type]: 'take';
}

/**
 * Returns first count elements
 */
export function take<A>(count: number): TakeTransducer<A> {
    return transducer('take', function* (iterable: Iterable<A>) {
        if (count < 1) return;
        let taken = 0;
        for (const a of iterable) {
            yield a;
            if (++taken >= count) return;
        }
    }, {count});
}

export function isTakeTransducer(value: any): value is TakeTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'take' && Object.hasOwn(value, 'count');
}
```

#### 3. DropTransducer
**File**: `packages/totallylazy/src/transducers/DropTransducer.ts` (new file)
**Changes**: Implement drop transducer

```typescript
/** @module Skip first N elements from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface DropTransducer<A> extends Transducer<A, A> {
    readonly count: number;
    readonly [Transducer.type]: 'drop';
}

/**
 * Skips first count elements
 */
export function drop<A>(count: number): DropTransducer<A> {
    return transducer('drop', function* (iterable: Iterable<A>) {
        let dropped = 0;
        for (const a of iterable) {
            if (dropped++ >= count) yield a;
        }
    }, {count});
}

export function isDropTransducer(value: any): value is DropTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'drop' && Object.hasOwn(value, 'count');
}
```

#### 4. FirstTransducer
**File**: `packages/totallylazy/src/transducers/FirstTransducer.ts` (new file)
**Changes**: Implement first transducer

```typescript
/** @module Get first element from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface FirstTransducer<A> extends Transducer<A, A> {
    readonly [Transducer.type]: 'first';
}

/**
 * Returns first element
 */
export function first<A>(): FirstTransducer<A> {
    return transducer('first', function* (iterable: Iterable<A>) {
        for (const a of iterable) {
            yield a;
            return;
        }
    }, {});
}

export function isFirstTransducer(value: any): value is FirstTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'first';
}
```

#### 5. LastTransducer
**File**: `packages/totallylazy/src/transducers/LastTransducer.ts` (new file)
**Changes**: Implement last transducer

```typescript
/** @module Get last element from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface LastTransducer<A> extends Transducer<A, A> {
    readonly [Transducer.type]: 'last';
}

/**
 * Returns last element
 */
export function last<A>(): LastTransducer<A> {
    return transducer('last', function* (iterable: Iterable<A>) {
        let lastValue: A | undefined;
        let hasValue = false;
        for (const a of iterable) {
            lastValue = a;
            hasValue = true;
        }
        if (hasValue) yield lastValue!;
    }, {});
}

export function isLastTransducer(value: any): value is LastTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'last';
}
```

#### 6. Tests for all Phase 1 transducers
**Files**: `packages/totallylazy/test/transducers/TakeTransducer.test.ts`, etc.

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Build passes (auto-generates exports, type checks, and runs tests): `./run build`

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [x] CI/CD build completes successfully: `gh run watch`
- [x] All build steps pass: Review build logs if any failures occur

#### Post-deployment Verification (Production):
- [x] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 2: Conditional Operations (takeWhile, dropWhile)

### Overview
Implement conditional taking and dropping operations using predicates.

### Changes Required:

#### 1. TakeWhileTransducer
**File**: `packages/totallylazy/src/transducers/TakeWhileTransducer.ts` (new file)

#### 2. DropWhileTransducer
**File**: `packages/totallylazy/src/transducers/DropWhileTransducer.ts` (new file)

#### 3. Tests
**Files**: `packages/totallylazy/test/transducers/TakeWhileTransducer.test.ts`, etc.

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Build passes (auto-generates exports, type checks, and runs tests): `./run build`

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [x] CI/CD build completes successfully: `gh run watch`
- [x] All build steps pass: Review build logs if any failures occur

#### Post-deployment Verification (Production):
- [x] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 3: Deduplication Operations (dedupe, unique)

### Overview
Implement deduplication transducers. Note: unique will use Set instead of AVLTree.

### Changes Required:

#### 1. DedupeTransducer
**File**: `packages/totallylazy/src/transducers/DedupeTransducer.ts` (new file)
**Changes**: Remove consecutive duplicates

#### 2. UniqueTransducer
**File**: `packages/totallylazy/src/transducers/UniqueTransducer.ts` (new file)
**Changes**: Remove all duplicates using Set

#### 3. Tests
**Files**: `packages/totallylazy/test/transducers/DedupeTransducer.test.ts`, etc.

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Build passes (auto-generates exports, type checks, and runs tests): `./run build`

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [x] CI/CD build completes successfully: `gh run watch`
- [x] All build steps pass: Review build logs if any failures occur

#### Post-deployment Verification (Production):
- [x] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 4: Aggregation Operations (scan, reduce)

### Overview
Implement scanning and reduction operations using the Reducer type.

### Changes Required:

#### 1. ScanTransducer
**File**: `packages/totallylazy/src/transducers/ScanTransducer.ts` (new file)
**Changes**: Accumulating map that emits intermediate values

#### 2. ReduceTransducer
**File**: `packages/totallylazy/src/transducers/ReduceTransducer.ts` (new file)
**Changes**: Reduce to single value

#### 3. Tests
**Files**: `packages/totallylazy/test/transducers/ScanTransducer.test.ts`, etc.

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Build passes (auto-generates exports, type checks, and runs tests): `./run build`

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [x] CI/CD build completes successfully: `gh run watch`
- [x] All build steps pass: Review build logs if any failures occur

#### Post-deployment Verification (Production):
- [x] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 5: Transformation Operations (zip, zipWithIndex, windowed)

### Overview
Implement zipping and windowing operations.

### Changes Required:

#### 1. ZipTransducer
**File**: `packages/totallylazy/src/transducers/ZipTransducer.ts` (new file)
**Changes**: Combine two iterables into tuples

#### 2. ZipWithIndexTransducer
**File**: `packages/totallylazy/src/transducers/ZipWithIndexTransducer.ts` (new file)
**Changes**: Add index to elements

#### 3. WindowedTransducer
**File**: `packages/totallylazy/src/transducers/WindowedTransducer.ts` (new file)
**Changes**: Sliding window with configurable size/step

#### 4. Tests
**Files**: `packages/totallylazy/test/transducers/ZipTransducer.test.ts`, etc.

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Build passes (auto-generates exports, type checks, and runs tests): `./run build`

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [x] CI/CD build completes successfully: `gh run watch`
- [x] All build steps pass: Review build logs if any failures occur

#### Post-deployment Verification (Production):
- [x] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 6: Sorting and Search (sort, find, single)

### Overview
Implement sorting using comparators and search operations.

### Changes Required:

#### 1. SortTransducer
**File**: `packages/totallylazy/src/transducers/SortTransducer.ts` (new file)
**Changes**: Sort using comparator (materialize to array, sort, yield)

#### 2. FindTransducer
**File**: `packages/totallylazy/src/transducers/FindTransducer.ts` (new file)
**Changes**: Find first matching element

#### 3. SingleTransducer
**File**: `packages/totallylazy/src/transducers/SingleTransducer.ts` (new file)
**Changes**: Extract single value with error handling

#### 4. Tests
**Files**: `packages/totallylazy/test/transducers/SortTransducer.test.ts`, etc.

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Build passes (auto-generates exports, type checks, and runs tests): `./run build`

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [ ] CI/CD build completes successfully: `gh run watch`
- [ ] All build steps pass: Review build logs if any failures occur

#### Post-deployment Verification (Production):
- [ ] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 7: Utility Operations (identity, decompose)

### Overview
Implement utility transducers for pass-through and introspection.

### Changes Required:

#### 1. IdentityTransducer
**File**: `packages/totallylazy/src/transducers/IdentityTransducer.ts` (new file)
**Changes**: Pass-through transducer

#### 2. Decompose helper function
**File**: `packages/totallylazy/src/transducers/CompositeTransducer.ts`
**Changes**: Add decompose function to extract transducers from composite

#### 3. Tests
**Files**: `packages/totallylazy/test/transducers/IdentityTransducer.test.ts`, etc.

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Build passes (auto-generates exports, type checks, and runs tests): `./run build`

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [ ] CI/CD build completes successfully: `gh run watch`
- [ ] All build steps pass: Review build logs if any failures occur

#### Post-deployment Verification (Production):
- [ ] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Testing Strategy

### Unit Tests:
- Each transducer has its own test file
- Test basic functionality with Array.from()
- Test introspection properties
- Test toString() output
- Test type guards
- Test edge cases (empty iterables, single elements)

### Integration Tests:
- Test composition of new transducers
- Test with existing transducers
- Test type inference

### Performance Verification:
- Ensure transducers are lazy (don't consume full iterable unless needed)
- Verify memory efficiency for large iterables

## Performance Considerations

- All transducers must be lazy (use generators)
- Avoid materializing iterables unless necessary (sort requires it)
- Use efficient data structures (Set for unique)
- Minimize object allocations in hot paths

## Migration Notes

- Old API used classes with sync/async methods
- New API uses functions with sync-only support
- Property names match for easier migration (e.g., `count`, `predicate`)

## References

- Original issue: Research document at `thoughts/shared/research/2025-10-30-totallylazy-feature-delta.md`
- Current implementation: `packages/totallylazy/src/transducers/`
- Old implementation reference: `../../../totallylazy.js/src/transducers/` (totallylazy.js is in project root)
- Pattern examples: MapTransducer.ts, FilterTransducer.ts