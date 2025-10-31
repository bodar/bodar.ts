# Curried/Partial Application Function Proxy Implementation Plan

## Overview

Implement a proxy-based currying utility that enables partial application while exposing applied arguments as properties for introspection. This will improve upon Ramda's closure-based approach by maintaining compatibility with TotallyLazy's introspection requirements and LazyRecords SQL conversion.

## Current State Analysis

### What Exists:
- TotallyLazy has consistent patterns for exposing function properties via `Object.assign()` (packages/totallylazy/src/transducers/Transducer.ts:20-25)
- All transducers expose their configuration as readonly properties for SQL introspection (packages/lazyrecords/src/sql/builder/builders.ts:42-64)
- No curry or partial application utilities exist in the codebase
- MapTransducer uses simple factory pattern: `transducer('map', function* {...}, {mapper})` (packages/totallylazy/src/transducers/MapTransducer.ts:13-19)

### Key Discoveries:
- LazyRecords requires direct property access (e.g., `transducer.mapper`) for SQL conversion (packages/lazyrecords/src/sql/builder/builders.ts:56,59)
- Ramda's closure-based currying is incompatible because arguments are hidden in closure scope
- Current toString() pattern uses `Object.values(source).join(', ')` (packages/totallylazy/src/transducers/Transducer.ts:23)
- Type guards check properties with `Object.hasOwn()` (packages/totallylazy/src/transducers/MapTransducer.ts:22-24)

### Constraints:
- Must expose partially applied arguments as enumerable properties
- Properties must be accessible via direct property access (not getters only)
- Must maintain compatibility with existing `Object.hasOwn()` checks
- toString() should work with current implementation (joining stringified values)

## Desired End State

A curry function that:
1. Returns a proxy that intercepts function calls for partial application
2. Exposes applied arguments as properties on the returned function
3. Supports progressive application until all arguments are satisfied
4. Works with TypeScript type inference (initially as `any`, refined in Phase 2)
5. Can replace existing transducer implementations (validated via acceptance test)

### Verification:
- Unit tests pass for curry with 1, 2, 3, and 4+ argument functions
- Properties are inspectable on partially applied functions
- toString() generates descriptive output
- Acceptance test: MapTransducer can be replaced with `curry(coreMapFunction)` and all existing tests pass

## What We're NOT Doing

- Placeholder support (e.g., Ramda's `R.__`) - deferred for future iteration
- Named argument object notation - deferred for future iteration
- Optimization for specific arities (1-3) like Ramda - start with general solution
- Integration helpers for converting existing code - not needed initially
- Performance optimizations - focus on correctness first

## Implementation Approach

1. Start with core proxy-based curry implementation using `any` types
2. Add comprehensive test coverage following TotallyLazy patterns
3. Layer TypeScript types for progressive refinement in separate phase
4. Validate with acceptance test replacing MapTransducer
5. If successful, incrementally replace other transducers

## Phase 1: Core Curry Proxy Implementation

### Overview
Implement the fundamental proxy-based curry function that handles partial application and exposes arguments as properties. TypeScript will see everything as `any` in this phase.

### Changes Required:

#### 1. Core Curry Function
**File**: `packages/totallylazy/src/functions/curry.ts`
**Changes**: Create new file with curry implementation

```typescript
/**
 * Curries a function, enabling partial application while exposing applied arguments as properties.
 *
 * Unlike Ramda's curry, this implementation exposes partially applied arguments as enumerable
 * properties on the returned function, enabling introspection for LazyRecords SQL conversion.
 *
 * @param fn - The function to curry
 * @returns A curried version that supports partial application with property introspection
 */
export function curry(fn: any): any {
    const arity = fn.length;

    function curried(...appliedArgs: any[]): any {
        // If we have all arguments, call the original function
        if (appliedArgs.length >= arity) {
            return fn(...appliedArgs);
        }

        // Create a new function that will accept more arguments
        const partialFn = function(...nextArgs: any[]) {
            return curried(...appliedArgs, ...nextArgs);
        };

        // Create properties object from applied arguments
        // Use parameter names if available, otherwise use positional (arg0, arg1, etc.)
        const properties: Record<string, any> = {};
        const paramNames = getParameterNames(fn);

        for (let i = 0; i < appliedArgs.length; i++) {
            const key = paramNames[i] || `arg${i}`;
            properties[key] = appliedArgs[i];
        }

        // Add metadata
        properties.toString = () => {
            const argStrings = appliedArgs.map((arg: any) => String(arg));
            return `${fn.name || 'anonymous'}(${argStrings.join(', ')})`;
        };

        // Use Object.assign to expose properties
        return Object.assign(partialFn, properties);
    }

    return curried;
}

/**
 * Extract parameter names from a function.
 * Falls back to generic names if parsing fails.
 */
function getParameterNames(fn: any): string[] {
    // Try to parse parameter names from function toString
    const fnStr = fn.toString();
    const match = fnStr.match(/\(([^)]*)\)/);

    if (match && match[1].trim()) {
        return match[1].split(',').map((param: string) => {
            // Handle default parameters and destructuring
            return param.trim().split('=')[0].trim().split(':')[0].trim();
        });
    }

    // Fallback: use positional names
    return Array.from({length: fn.length}, (_, i) => `arg${i}`);
}
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Create curry.ts file in packages/totallylazy/src/functions/
- [ ] Type checking passes: `./run check` (TypeScript compiles with any types)
- [ ] File uses consistent style with existing codebase
- [ ] No linting errors when linter is run

**Implementation Note**: After file creation, pause and create tests before proceeding.

## Phase 2: Test Coverage

### Overview
Add comprehensive test coverage following TotallyLazy's testing patterns to verify curry behavior, introspection, and edge cases.

### Changes Required:

#### 1. Core Curry Tests
**File**: `packages/totallylazy/test/functions/curry.test.ts`
**Changes**: Create new test file

```typescript
import {assertThat, equals, is} from "../../src/testing.ts";
import {curry} from "../../src/functions/curry.ts";

describe("curry", () => {
    it("curries a single argument function", () => {
        const fn = (a: number) => a * 2;
        const curried = curry(fn);

        assertThat(curried(5), is(10));
    });

    it("curries a two argument function - apply both at once", () => {
        const fn = (a: number, b: number) => a + b;
        const curried = curry(fn);

        assertThat(curried(3, 4), is(7));
    });

    it("curries a two argument function - apply one at a time", () => {
        const fn = (a: number, b: number) => a + b;
        const curried = curry(fn);
        const partial = curried(3);

        assertThat(partial(4), is(7));
    });

    it("curries a three argument function - various combinations", () => {
        const fn = (a: number, b: number, c: number) => (a + b) * c;
        const curried = curry(fn);

        assertThat(curried(2, 3, 4), is(20));
        assertThat(curried(2)(3, 4), is(20));
        assertThat(curried(2, 3)(4), is(20));
        assertThat(curried(2)(3)(4), is(20));
    });

    it("curries a four+ argument function", () => {
        const fn = (a: number, b: number, c: number, d: number) => (a + b * c) / d;
        const curried = curry(fn);

        assertThat(curried(12, 3, 6, 2), is(15));
        assertThat(curried(12)(3, 6, 2), is(15));
        assertThat(curried(12, 3)(6, 2), is(15));
        assertThat(curried(12, 3, 6)(2), is(15));
    });

    it("works with functions that have default parameters", () => {
        const fn = (a: number, b: number = 10) => a + b;
        const curried = curry(fn);

        // With default, arity is 1
        assertThat(curried(5), is(15));
    });

    it("exposes applied arguments as properties - single arg", () => {
        const fn = (mapper: any) => mapper;
        const curried = curry(fn);
        const partial = curried(String);

        assertThat(partial.mapper, is(String));
    });

    it("exposes applied arguments as properties - multiple args", () => {
        const fn = (reducer: any, seed: number) => ({reducer, seed});
        const curried = curry(fn);
        const partial = curried(Math.max, 0);

        assertThat(partial.reducer, is(Math.max));
        assertThat(partial.seed, is(0));
    });

    it("exposes partially applied arguments as properties", () => {
        const fn = (a: number, b: number, c: number) => a + b + c;
        const curried = curry(fn);
        const partial1 = curried(1);
        const partial2 = partial1(2);

        assertThat(partial1.a, is(1));
        assertThat(partial2.a, is(1));
        assertThat(partial2.b, is(2));
    });

    it("is self describing - shows applied arguments", () => {
        const fn = function mapper(a: number, b: number) { return a + b; };
        const curried = curry(fn);
        const partial = curried(5);

        assertThat(partial.toString(), is("mapper(5)"));
    });

    it("is self describing - multiple arguments", () => {
        const fn = function reduce(reducer: any, seed: number) { return {reducer, seed}; };
        const curried = curry(fn);
        const partial = curried(Math.max, 0);

        // Should show both arguments
        const result = partial.toString();
        assertThat(result.includes("Math.max"), is(true));
        assertThat(result.includes("0"), is(true));
    });

    it("handles anonymous functions", () => {
        const curried = curry((a: number, b: number) => a * b);
        const partial = curried(3);

        assertThat(partial(4), is(12));
        assertThat(partial.arg0, is(3)); // Falls back to positional names
    });

    it("properties are enumerable for Object.hasOwn checks", () => {
        const fn = (mapper: any) => mapper;
        const curried = curry(fn);
        const partial = curried(String);

        assertThat(Object.hasOwn(partial, 'mapper'), is(true));
    });

    it("properties are accessible via Object.values for toString", () => {
        const fn = (a: number, b: string) => ({a, b});
        const curried = curry(fn);
        const partial = curried(42, "test");

        const values = Object.values({a: partial.a, b: partial.b});
        assertThat(values, equals([42, "test"]));
    });

    describe("edge cases", () => {
        it("handles zero-argument functions", () => {
            const fn = () => 42;
            const curried = curry(fn);

            assertThat(curried(), is(42));
        });

        it("handles functions with rest parameters", () => {
            const fn = (...args: number[]) => args.reduce((a, b) => a + b, 0);
            const curried = curry(fn);

            // Rest parameters have arity 0, so should execute immediately
            assertThat(curried(), is(0));
        });

        it("can curry an already curried function", () => {
            const fn = (a: number, b: number) => a + b;
            const curried1 = curry(fn);
            const curried2 = curry(curried1);

            assertThat(curried2(3, 4), is(7));
        });
    });
});
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Tests compile: `./run check`
- [ ] All tests pass: `./run test packages/totallylazy/test/functions/curry.test.ts`
- [ ] Tests follow TotallyLazy patterns (functional behavior, inspectability, self-describing)
- [ ] Edge cases covered (0 args, rest params, anonymous functions)

**Implementation Note**: After tests pass locally, request human approval to commit.

#### Build Verification:
- [ ] CI/CD build completes: `gh run watch`
- [ ] All build steps pass

#### Post-deployment Verification:
- [ ] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 3: TypeScript Type System

### Overview
Add comprehensive TypeScript types for progressive type refinement as arguments are applied. This replaces all `any` types from Phase 1.

### Changes Required:

#### 1. Type Definitions
**File**: `packages/totallylazy/src/functions/curry.ts`
**Changes**: Add type definitions and update function signatures

```typescript
/**
 * Extract parameter names from a function type as a tuple
 */
type ParameterNames<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;

/**
 * Create an object type with parameter values as properties
 */
type ParameterProperties<T extends (...args: any[]) => any, Applied extends any[]> = {
    [K in keyof Applied as K extends number ? `arg${K}` : never]: Applied[K]
} & {
    toString(): string;
};

/**
 * Progressive currying type - each application returns either:
 * - The final result if all args are applied
 * - A curried function with applied args as properties if more args needed
 */
type Curried<T extends (...args: any[]) => any, Applied extends any[] = []> =
    Parameters<T> extends [...Applied, ...infer Remaining]
        ? Remaining extends []
            ? ReturnType<T>
            : Remaining extends [infer Next, ...infer Rest]
                ? {
                    (...args: [Next, ...Rest]): ReturnType<T>;
                    (arg: Next): Curried<T, [...Applied, Next]>;
                } & ParameterProperties<T, Applied>
                : never
        : ReturnType<T>;

/**
 * Main curry function type
 */
export function curry<T extends (...args: any[]) => any>(fn: T): Curried<T> {
    // Implementation remains the same as Phase 1
    const arity = fn.length;

    function curried(...appliedArgs: any[]): any {
        if (appliedArgs.length >= arity) {
            return fn(...appliedArgs);
        }

        const partialFn = function(...nextArgs: any[]) {
            return curried(...appliedArgs, ...nextArgs);
        };

        const properties: Record<string, any> = {};
        const paramNames = getParameterNames(fn);

        for (let i = 0; i < appliedArgs.length; i++) {
            const key = paramNames[i] || `arg${i}`;
            properties[key] = appliedArgs[i];
        }

        properties.toString = () => {
            const argStrings = appliedArgs.map((arg: any) => String(arg));
            return `${fn.name || 'anonymous'}(${argStrings.join(', ')})`;
        };

        return Object.assign(partialFn, properties);
    }

    return curried() as Curried<T>;
}

function getParameterNames(fn: any): string[] {
    const fnStr = fn.toString();
    const match = fnStr.match(/\(([^)]*)\)/);

    if (match && match[1].trim()) {
        return match[1].split(',').map((param: string) => {
            return param.trim().split('=')[0].trim().split(':')[0].trim();
        });
    }

    return Array.from({length: fn.length}, (_, i) => `arg${i}`);
}
```

#### 2. Type Tests
**File**: `packages/totallylazy/test/functions/curry.test.ts`
**Changes**: Add type-level tests to existing test file

```typescript
describe("curry - type tests", () => {
    it("correctly types single argument function", () => {
        const fn = (a: number) => a * 2;
        const curried = curry(fn);

        // TypeScript should infer:
        // curried: (a: number) => number
        const result: number = curried(5);
        assertThat(result, is(10));
    });

    it("correctly types two argument function - full application", () => {
        const fn = (a: number, b: string) => `${a}${b}`;
        const curried = curry(fn);

        // TypeScript should infer:
        // curried: ((a: number, b: string) => string) | ((a: number) => (b: string) => string)
        const result: string = curried(5, "test");
        assertThat(result, is("5test"));
    });

    it("correctly types two argument function - partial application", () => {
        const fn = (a: number, b: string) => `${a}${b}`;
        const curried = curry(fn);
        const partial = curried(5);

        // TypeScript should infer:
        // partial: ((b: string) => string) & {a: number, toString(): string}
        const result: string = partial("test");
        assertThat(result, is("5test"));

        // Property should be typed
        const a: number = partial.a;
        assertThat(a, is(5));
    });

    it("correctly types three argument function", () => {
        const fn = (a: number, b: string, c: boolean) => ({a, b, c});
        const curried = curry(fn);

        const partial1 = curried(1);
        const partial2 = partial1("test");
        const result = partial2(true);

        // Properties should be typed at each stage
        const a: number = partial1.a;
        const b: string = partial2.b;

        assertThat(result, equals({a: 1, b: "test", c: true}));
    });

    it("preserves generic types", () => {
        const fn = <A, B>(mapper: (a: A) => B) => (iterable: Iterable<A>): Iterable<B> => {
            return Array.from(iterable).map(mapper);
        };

        const curried = curry(fn);
        const partial = curried((n: number) => String(n));

        // Should infer correctly
        const result = partial([1, 2, 3]);
        assertThat(Array.from(result), equals(["1", "2", "3"]));
    });
});
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check` (no TypeScript errors)
- [ ] All tests pass: `./run test packages/totallylazy/test/functions/curry.test.ts`
- [ ] IDE autocomplete works for partial application
- [ ] Type inference works for 1, 2, 3, and 4 argument functions
- [ ] Properties are correctly typed on partial functions

**Implementation Note**: After tests pass and types check, request human approval to commit.

#### Build Verification:
- [ ] CI/CD build completes: `gh run watch`
- [ ] All build steps pass

#### Post-deployment Verification:
- [ ] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 4: Acceptance Test - MapTransducer Replacement

### Overview
Validate that curry works with real transducers by creating a standalone core map function and testing if `curry(coreMap)` can replace the current MapTransducer implementation.

### Changes Required:

#### 1. Core Map Function
**File**: `packages/totallylazy/test/functions/curry.test.ts`
**Changes**: Add acceptance test section with core map implementation

```typescript
describe("curry - acceptance test: MapTransducer replacement", () => {
    // Extract the core map functionality (currently anonymous generator in MapTransducer)
    function coreMap<A, B>(mapper: (a: A) => B) {
        return function* (iterable: Iterable<A>): Iterable<B> {
            for (const a of iterable) {
                yield mapper(a);
            }
        };
    }

    it("curried coreMap behaves like MapTransducer", () => {
        const curriedMap = curry(coreMap);
        const transducer = curriedMap(String);

        // Should work as a transducer
        const result = Array.from(transducer([1, 2, 3]));
        assertThat(result, equals(['1', '2', '3']));
    });

    it("curried coreMap exposes mapper property", () => {
        const curriedMap = curry(coreMap);
        const transducer = curriedMap(String);

        // Should expose mapper for introspection
        assertThat(transducer.mapper, is(String));
        assertThat(Object.hasOwn(transducer, 'mapper'), is(true));
    });

    it("curried coreMap is self describing", () => {
        const curriedMap = curry(coreMap);
        const transducer = curriedMap(String);

        // Should have toString
        const str = transducer.toString();
        assertThat(str.includes('String'), is(true));
    });

    it("curried coreMap works with LazyRecords-style type guards", () => {
        const curriedMap = curry(coreMap);
        const transducer = curriedMap(String);

        // Simulate the type guard pattern from MapTransducer
        function isMapLike(value: any): boolean {
            return typeof value === 'function'
                && Object.hasOwn(value, 'mapper');
        }

        assertThat(isMapLike(transducer), is(true));
    });

    it("curried coreMap can be composed like transducers", () => {
        const curriedMap = curry(coreMap);
        const toString = curriedMap(String);
        const toUpper = curriedMap((s: string) => s.toUpperCase());

        // Should compose (apply one then the other)
        const composed = (it: Iterable<any>) => toUpper(toString(it));
        const result = Array.from(composed([1, 2, 3]));

        assertThat(result, equals(['1', '2', '3']));
    });
});
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Acceptance tests pass: `./run test packages/totallylazy/test/functions/curry.test.ts`
- [ ] Core map function with curry exposes mapper property
- [ ] Type guards work with curried function
- [ ] toString() produces useful output
- [ ] Functional behavior matches MapTransducer

**Implementation Note**: If acceptance tests pass, we've validated that curry can replace transducer implementations. Document this success before proceeding to actual MapTransducer replacement.

#### Build Verification:
- [ ] CI/CD build completes: `gh run watch`
- [ ] All build steps pass

#### Post-deployment Verification:
- [ ] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 5: MapTransducer Replacement (If Acceptance Test Passes)

### Overview
If Phase 4 acceptance tests pass, replace the MapTransducer implementation to use curry. This validates the real-world integration.

### Changes Required:

#### 1. Update MapTransducer Implementation
**File**: `packages/totallylazy/src/transducers/MapTransducer.ts`
**Changes**: Replace current implementation with curry-based version

```typescript
/** @module Transducer that maps elements using a function */
import type {Mapper} from "../functions/Mapper.ts";
import {Transducer, transducer} from "./Transducer.ts";
import {curry} from "../functions/curry.ts";

/** A transducer that maps the given iterable by the given mapper */
export interface MapTransducer<A, B> extends Transducer<A, B> {
    readonly mapper: Mapper<A, B>;
    readonly [Transducer.type]: 'map';
}

/** Core map functionality extracted for curry */
function coreMap<A, B>(mapper: Mapper<A, B>) {
    return function* (iterable: Iterable<A>): Iterable<B> {
        for (const a of iterable) {
            yield mapper(a);
        }
    };
}

/** Creates a transducer that maps the given iterable by the given mapper */
export function map<A, B>(mapper: Mapper<A, B>): MapTransducer<A, B> {
    const curriedCore = curry(coreMap);
    const partial = curriedCore(mapper);

    // Wrap in transducer to add type symbol and maintain interface
    return transducer('map', partial, {mapper});
}

/** Type guard to check if a value is a MapTransducer */
export function isMapTransducer(value: any): value is MapTransducer<any, any> {
    return value instanceof Transducer && value[Transducer.type] === 'map' && Object.hasOwn(value, 'mapper');
}
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] All MapTransducer tests pass: `./run test packages/totallylazy/test/transducers/MapTransducer.test.ts`
- [ ] All transducer tests still pass: `./run test packages/totallylazy/test/transducers/`
- [ ] LazyRecords tests still pass: `./run test packages/lazyrecords/test/`

**Implementation Note**: Only proceed with this phase if acceptance test passed. If any tests fail, analyze and fix before committing.

#### Build Verification:
- [ ] CI/CD build completes: `gh run watch`
- [ ] All build steps pass

#### Post-deployment Verification:
- [ ] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`
- [ ] All package tests pass in production build

---

## Testing Strategy

### Unit Tests:
- Single, two, three, and four+ argument functions
- Partial application at each stage
- Property exposure and introspection
- toString() output
- Edge cases: zero args, rest params, anonymous functions, default parameters
- Type-level tests for inference

### Integration Tests:
- Acceptance test with core map function
- Type guards work with curried functions
- Composition with other curried functions
- Compatibility with Object.hasOwn() checks
- Compatibility with Object.values() for toString()

### Local Verification (Pre-commit):
1. Run type checking: `./run check`
2. Run all curry tests: `./run test packages/totallylazy/test/functions/curry.test.ts`
3. Run acceptance test: verify curry(coreMap) works like MapTransducer
4. If replacing MapTransducer: run all transducer and lazyrecords tests

### Build Verification:
1. Wait for CI/CD build: `gh run watch`
2. Verify all build steps pass

### Production Verification:
1. Check JSR score: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`
2. Verify score remains 100%

## Performance Considerations

- Proxy overhead: acceptable for correctness-first approach
- Parameter name parsing happens once per partial application
- Object.assign creates new object for each partial application
- Future optimization: cache parameter names

## Migration Notes

### If MapTransducer Replacement Succeeds:
1. Incrementally replace other transducers (FilterTransducer, ReduceTransducer, etc.)
2. Create helper to wrap transducer() + curry pattern
3. Update documentation to show curry as recommended pattern

### If MapTransducer Replacement Fails:
1. Analyze what broke (tests, type guards, SQL conversion)
2. Adjust curry implementation or transducer() integration
3. Re-run acceptance test until it passes

## References

- Original research: `thoughts/shared/research/2025-10-31-6-curried-partial-application-proxy.md`
- Issue: #6 (curried/partial application function proxy)
- Transducer pattern: `packages/totallylazy/src/transducers/Transducer.ts:20-25`
- LazyRecords SQL conversion: `packages/lazyrecords/src/sql/builder/builders.ts:42-64`
- Ramda curry reference: `/home/dan/Projects/ramda/source/curry.js`
