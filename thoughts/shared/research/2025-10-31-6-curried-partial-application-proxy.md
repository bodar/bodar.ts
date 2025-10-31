---
date: 2025-10-31T15:48:18+0000
researcher: dan
git_commit: b3135bcb25590f9271a6353e6308ace00b14ed4b
branch: master
repository: bodar.ts
topic: "Create curried / partial application function proxy for issue #6"
tags: [research, codebase, currying, transducers, lazyrecords, ramda, typescript]
status: complete
last_updated: 2025-10-31
last_updated_by: dan
---

# Research: Create curried / partial application function proxy for issue #6

**Date**: 2025-10-31T15:48:18+0000
**Researcher**: dan
**Git Commit**: b3135bcb25590f9271a6353e6308ace00b14ed4b
**Branch**: master
**Repository**: bodar.ts

## Research Question
What work is needed to implement a curried/partial application function proxy that improves upon existing solutions like Ramda, while maintaining compatibility with TotallyLazy's transducers and LazyRecords' introspection requirements?

## Summary
The research reveals that issue #6 requires creating a curried/partial application function proxy that combines the automatic currying capabilities of libraries like Ramda with TotallyLazy's unique introspection requirements for LazyRecords SQL conversion. The current TotallyLazy transducers successfully expose their configuration as properties on function objects, enabling LazyRecords to inspect and convert them to SQL queries. The new currying solution must preserve this introspection capability while adding support for partial application, TypeScript types, default arguments, and improved developer experience.

## Detailed Findings

### Current TotallyLazy Transducer Implementation

#### Core Architecture
The transducer system in TotallyLazy provides composable, lazy transformations over iterables with built-in introspection capabilities ([Transducer.ts:3-25](packages/totallylazy/src/transducers/Transducer.ts#L3-25)).

**Key Components:**
- **Base Interface**: Transducers are callable functions `(iterable: Iterable<A>) => Iterable<B>`
- **Type Branding**: Uses `[Transducer.type]` symbol property for type discrimination
- **Introspection**: Properties exposed via `Object.assign()` in the `transducer()` helper
- **Self-Description**: Auto-generated `toString()` method shows captured arguments

**Factory Pattern ([Transducer.ts:19-25](packages/totallylazy/src/transducers/Transducer.ts#L19-25)):**
```typescript
export function transducer<N, T, U>(name: N, target: T, source: U): {[Transducer.type]: N} & T & U {
    return Object.assign(target, {
        [Transducer.type]: name,
        toString: () => `${name}(${Object.values(source).join(', ')})`
    }, source);
}
```

**Example Implementation ([MapTransducer.ts:13-19](packages/totallylazy/src/transducers/MapTransducer.ts#L13-19)):**
- Captures `mapper` argument
- Passes generator function as implementation
- Exposes `{mapper}` as inspectable property
- Type guard checks for property existence

### LazyRecords SQL Conversion Requirements

#### Introspection Mechanism
LazyRecords converts transducers to SQL by inspecting their properties ([builders.ts:42-64](packages/lazyrecords/src/sql/builder/builders.ts#L42-64)):

**Process Flow:**
1. Type guards identify transducer type (`isMapTransducer`, `isFilterTransducer`)
2. Properties accessed directly (`transducer.mapper`, `transducer.predicate`)
3. Properties converted to SQL components (`toSelectList()`, `toCompound()`)
4. Recursive descent through nested structures

**Critical Properties Inspected:**
- `mapper` - for SELECT list generation
- `predicate` - for WHERE clause generation
- `reducer`, `seed` - for aggregation
- `count` - for LIMIT clauses
- `transducers` - for composite transducer decomposition

### Ramda's Currying Implementation Analysis

#### Architecture Overview
Ramda implements automatic currying through optimized, arity-specific functions for common cases (1-3 arguments) and a general `_curryN` for higher arities.

**Key Patterns:**
- **Optimized Path**: Separate implementations for arity 1-3 using switch statements
- **Closure-Based**: Arguments captured in closure scope (NOT inspectable)
- **Placeholder Support**: `R.__` allows specifying gaps in argument lists
- **Recursive Accumulation**: `_curryN` builds up arguments across multiple calls

**Critical Limitation for Issue #6:**
Arguments are stored exclusively in closure scope with no properties exposing partially applied arguments. This makes Ramda's approach incompatible with LazyRecords' introspection needs.

### Requirements from Issue #6

The issue specifies several improvements over Ramda's implementation:

1. **Introspection of Applied Arguments**: Returned functions must have properties matching named arguments
2. **Full TypeScript Support**: Types must be correct as arguments are applied
3. **Default Arguments Support**: Must work with ES6 default parameters
4. **Nice toString() Support**: Should show captured values in argument positions
5. **Lazy Currying**: Only curry when needed, not upfront
6. **Named Arguments Support**: Possible support for calling with object notation

### Existing Test Patterns

TotallyLazy follows consistent testing patterns ([test/transducers](packages/totallylazy/test/transducers/)):

**Standard Test Cases:**
- "can be created first then applied to an iterable" - functional behavior
- "is inspectable" - verifies exposed properties
- "is self describing" - tests toString() output
- Type guard tests in separate describe block
- Edge cases (empty, single element, boundaries)
- Type variations testing

**Key Assertion Patterns:**
- `assertThat(transducer.mapper, is(String))` - property inspection
- `assertThat(transducer.toString(), is('map(...)'))` - string representation
- `assertThat(isMapTransducer(value), is(true))` - type guards

### TypeScript Requirements

Based on analysis of existing code and issue requirements:

1. **Progressive Type Refinement**: As arguments are applied, remaining parameter types must be inferred
2. **Generic Preservation**: Type parameters must flow through partial application
3. **Overload Support**: Multiple signatures for different arities
4. **Type Guard Compatibility**: Result must satisfy existing type guard patterns
5. **Default Parameter Handling**: Must preserve optional/default parameter semantics

### Implementation Considerations

#### Proxy-Based Approach
The issue suggests using a Proxy to handle:
- Dynamic property access for introspection
- Function call interception for partial application
- toString() customization
- Lazy evaluation of currying

#### Property Exposure Strategy
Similar to current `transducer()` helper:
- Use `Object.assign()` or Proxy handler to expose arguments as properties
- Maintain compatibility with `Object.hasOwn()` checks
- Ensure properties are enumerable for `Object.values()`

#### Type System Integration
- Use TypeScript conditional types for progressive refinement
- Maintain separate interface for partially applied functions
- Support inference from function.length (accounting for defaults)

## Code References

### Core Implementation Files
- `packages/totallylazy/src/transducers/Transducer.ts:3-25` - Base transducer interface and factory
- `packages/totallylazy/src/transducers/MapTransducer.ts:6-24` - Example transducer with property exposure
- `packages/totallylazy/src/transducers/CompositeTransducer.ts:5-54` - Complex transducer with array property

### LazyRecords Integration
- `packages/lazyrecords/src/sql/builder/builders.ts:42-64` - Transducer to SQL conversion
- `packages/lazyrecords/src/sql/postgres/PostgresRecords.ts:45-48` - SQL query execution with transducers

### Ramda Reference Implementation
- `/home/dan/Projects/ramda/source/curry.js:52-53` - Main curry entry point
- `/home/dan/Projects/ramda/source/internal/_curryN.js:15-45` - General n-arity implementation
- `/home/dan/Projects/ramda/source/internal/_curry2.js:13-32` - Optimized 2-arity example

### Test Examples
- `packages/totallylazy/test/transducers/MapTransducer.test.ts:14-16` - Property inspection test
- `packages/totallylazy/test/transducers/CompositeTransducer.test.ts:19-21` - Array property inspection

## Architecture Documentation

### Current Pattern: Function with Properties
TotallyLazy successfully combines function application with property inspection by using `Object.assign()` to merge properties onto function objects. This pattern enables:
- Direct function calls for clean API
- Property access for introspection
- Type guards using property checks
- SQL generation from functional composition

### Proposed Pattern: Proxy-Enhanced Currying
The new implementation should:
1. Wrap functions in a Proxy for call interception
2. Store applied arguments as properties on the proxy target
3. Return new proxied functions for partial application
4. Maintain type safety through TypeScript generics
5. Support both positional and named argument patterns
6. Generate descriptive toString() representations

### Integration Points
- Must satisfy existing `Transducer` type guards
- Properties must be accessible via `Object.hasOwn()`
- Should work with `decompose()` and other utilities
- Must maintain lazy evaluation semantics

## Related Research
- Existing transducer implementations in `packages/totallylazy/src/transducers/`
- LazyRecords SQL builder in `packages/lazyrecords/src/sql/builder/`
- Ramda curry implementation in `/home/dan/Projects/ramda/source/internal/`

## Open Questions
1. Should the proxy implementation optimize for specific arities like Ramda?
2. How should placeholder support be implemented (if at all)?
3. Should named argument object notation be a primary or secondary feature?
4. What performance trade-offs are acceptable for introspection capability?
5. How should the implementation handle variadic functions?