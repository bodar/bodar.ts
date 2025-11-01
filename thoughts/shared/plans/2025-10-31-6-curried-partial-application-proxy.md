# Curried/Partial Application Function Proxy Implementation Plan

## Overview

Implement a proxy-based currying utility that enables partial application while exposing applied arguments as properties for introspection. This will improve upon Ramda's closure-based approach by maintaining compatibility with TotallyLazy's introspection requirements and LazyRecords SQL conversion.

## Implementation Status

### ✅ Completed:
- **Core curry implementation** in `packages/totallylazy/src/functions/curry.ts`:
  - Proxy-based approach using `CurryHandler`
  - Parameter name extraction via `parametersOf(fn)`
  - Property exposure for applied arguments
  - Placeholder `_` support for applying later arguments
  - toString() implementation showing function name and applied arguments
  - Default parameter handling
- **Test coverage** in `packages/totallylazy/test/functions/curry.test.ts`:
  - Basic currying (1, 2, 3, 4+ arguments)
  - Partial application at various stages
  - Property introspection tests
  - toString() verification
  - Default parameter handling
  - Placeholder `_` usage
  - Example test showing curried map transducer

### 🚧 Remaining:
- TypeScript type definitions (currently uses `any`)
- Acceptance test validation with MapTransducer replacement
- Integration with existing transducer pattern if acceptance test passes

## Current State Analysis

### What Exists:
- TotallyLazy has consistent patterns for exposing function properties via `Object.assign()` (packages/totallylazy/src/transducers/Transducer.ts:20-25)
- All transducers expose their configuration as readonly properties for SQL introspection
- MapTransducer uses `transducer('map', function* {...}, {mapper})` factory pattern (packages/totallylazy/src/transducers/MapTransducer.ts:13-19)
- **NEW**: Curry utility with Proxy-based implementation (packages/totallylazy/src/functions/curry.ts)

### Key Discoveries:
- LazyRecords requires direct property access (e.g., `transducer.mapper`) for SQL conversion
- Ramda's closure-based currying is incompatible because arguments are hidden in closure scope
- Current toString() pattern uses `Object.values(source).join(', ')` (packages/totallylazy/src/transducers/Transducer.ts:23)
- Type guards check properties with `Object.hasOwn()` or `in` operator (packages/totallylazy/src/transducers/MapTransducer.ts:22-24)
- **VALIDATED**: Proxy approach successfully exposes applied arguments as properties

### Constraints:
- Must expose partially applied arguments as enumerable properties ✅
- Properties must be accessible via direct property access (not getters only) ✅
- Must maintain compatibility with existing `Object.hasOwn()` and `in` checks ✅
- toString() should work with current implementation (joining stringified values) ✅

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

- Named argument object notation - deferred for future iteration
- Integration helpers for converting existing code - not needed initially
- Performance optimizations - correctness first, optimize if needed later

## Implementation Approach

1. Start with core proxy-based curry implementation using `any` types
2. Add comprehensive test coverage following TotallyLazy patterns
3. Layer TypeScript types for progressive refinement in separate phase
4. Validate with acceptance test replacing MapTransducer
5. If successful, incrementally replace other transducers

## Phase 1: Core Curry Proxy Implementation ✅

### Overview
Implement the fundamental proxy-based curry function that handles partial application and exposes arguments as properties.

### Implementation Summary:
- **File**: `packages/totallylazy/src/functions/curry.ts`
- Used Proxy with `CurryHandler` class instead of recursive function approach
- Implemented `parametersOf(fn)` to extract parameter names and detect defaults
- Added placeholder `_` symbol for applying later arguments
- Properties exposed via Proxy `get` trap (returns from `parameters` object)
- toString() implementation via Proxy `get` trap
- Default parameter handling via `hasDefault` check

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Create curry.ts file in packages/totallylazy/src/functions/
- [x] Type checking passes: `./run check` (TypeScript compiles with any types)
- [x] File uses consistent style with existing codebase

## Phase 2: Test Coverage ✅

### Overview
Add comprehensive test coverage following TotallyLazy's testing patterns to verify curry behavior, introspection, and edge cases.

### Implementation Summary:
- **File**: `packages/totallylazy/test/functions/curry.test.ts`
- Tests for basic currying (1, 2, 3, 4+ arguments)
- Partial application verification
- Property introspection (via `.mapper`, `.a`, `.b`, etc.)
- toString() verification for named functions
- Default parameter handling
- Anonymous function support with fallback to `arg0` naming
- Property enumeration tests (Object.hasOwn)
- Placeholder `_` tests for applying later arguments
- **Curried map example** demonstrating transducer pattern compatibility

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Tests compile: `./run check`
- [x] All tests pass: `./run test packages/totallylazy/test/functions/curry.test.ts`
- [x] Tests follow TotallyLazy patterns
- [x] Edge cases covered

#### Build Verification:
- [ ] CI/CD build completes: `gh run watch`
- [ ] All build steps pass

#### Post-deployment Verification:
- [ ] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 3: TypeScript Type System ✅

### Overview
Add comprehensive TypeScript types for progressive type refinement as arguments are applied. Replace `any` types with proper type definitions.

### Implementation Summary:
- **File**: `packages/totallylazy/src/functions/curry.ts`
- Created arity-specific types: `Curried1`, `Curried2`, `Curried3`, `Curried4`
- Main `Curried<F>` type dispatches to appropriate arity type based on function signature
- Added `Placeholder` type for the `_` symbol
- Each curried type supports all partial application combinations (e.g., `Curried2` can be called with 2 args or 1 arg)
- Properties exposed via `{ readonly [K: string]: any }` for runtime parameter name access
- Placeholder symbol typed to work with all parameter positions
- One edge case requires `as any`: placeholder + default parameter interaction (runtime works, types too complex)

### Changes Required:

#### 1. Type Definitions ✅
**File**: `packages/totallylazy/src/functions/curry.ts`
**Approach**:
- Create type utilities for progressive parameter capture
- Type `Curried<T>` to represent function at each stage of partial application
- Expose applied arguments as typed properties
- Handle parameter name extraction at type level (challenging - may need to use positional `arg0`, `arg1` etc.)

#### 2. Type Tests ✅
**File**: `packages/totallylazy/test/functions/curry.test.ts`
**Approach**:
- Add type-level tests that verify TypeScript inference
- Test single, two, three argument functions
- Verify properties are correctly typed
- Ensure generic type preservation

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Type checking passes: `./run check` (no TypeScript errors)
- [x] All tests pass including new type tests
- [x] IDE autocomplete works for partial application
- [x] Type inference works for 1, 2, 3, and 4 argument functions
- [x] Properties are correctly typed on partial functions

#### Build Verification:
- [x] CI/CD build completes: `gh run watch`
- [x] All build steps pass

#### Post-deployment Verification:
- [x] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 4: Acceptance Test - MapTransducer Replacement

### Overview
Validate that curry works with real transducers by testing if a curried map function can work like MapTransducer with proper introspection.

### Implementation Note:
**Partial validation exists**: The test file already includes a "curried map example test" (lines 108-133) that demonstrates:
- ✅ Basic transducer behavior (`Array.from(transducer([1, 2, 3]))`)
- ✅ Property introspection (`transducer.mapper`)
- ✅ Self-describing toString (`map(${String})`)
- ✅ Type guard compatibility (`isMapTransducer(transducer)`)

### Changes Required:

#### 1. Extended Acceptance Tests
**File**: `packages/totallylazy/test/functions/curry.test.ts`
**Approach**:
- Expand existing "curried map example test" into comprehensive acceptance test suite
- Test composition with other transducers
- Verify LazyRecords SQL introspection patterns work
- Test edge cases (empty iterables, error handling, etc.)

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Acceptance tests pass: `./run test packages/totallylazy/test/functions/curry.test.ts`
- [ ] Curried map exposes mapper property correctly
- [ ] Type guards work (`isMapTransducer`, `Object.hasOwn`, `in` operator)
- [ ] toString() produces useful output
- [ ] Functional behavior matches MapTransducer
- [ ] Composition with other transducers works

#### Build Verification:
- [ ] CI/CD build completes: `gh run watch`
- [ ] All build steps pass

#### Post-deployment Verification:
- [ ] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

---

## Phase 5: MapTransducer Replacement (If Acceptance Test Passes)

### Overview
If Phase 4 acceptance tests pass, optionally replace the MapTransducer implementation to use curry directly. This validates real-world integration.

### Decision Point:
**Current implementation already works**: MapTransducer uses `transducer('map', function* {...}, {mapper})` pattern which successfully exposes properties. Replacing with curry is optional - only do if there's a clear benefit (e.g., cleaner code, better type inference, reduced duplication).

### Changes Required (if proceeding):

#### 1. Update MapTransducer Implementation
**File**: `packages/totallylazy/src/transducers/MapTransducer.ts`
**Approach**:
- Extract core map generator function
- Apply curry to create partial application
- Wrap result in `transducer()` to maintain type symbol and interface
- Ensure all existing tests pass

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] All MapTransducer tests pass: `./run test packages/totallylazy/test/transducers/MapTransducer.test.ts`
- [ ] All transducer tests still pass: `./run test packages/totallylazy/test/transducers/`
- [ ] LazyRecords tests still pass: `./run test packages/lazyrecords/test/`

#### Build Verification:
- [ ] CI/CD build completes: `gh run watch`
- [ ] All build steps pass

#### Post-deployment Verification:
- [ ] JSR Score remains 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`
- [ ] All package tests pass in production build

---

## Testing Strategy

### Unit Tests (✅ Completed):
- Basic currying: 1, 2, 3, 4+ arguments
- Partial application at each stage
- Property exposure and introspection
- toString() output verification
- Edge cases: zero args, rest params, anonymous functions, default parameters
- Placeholder `_` support

### Integration Tests (Partial):
- ✅ Basic transducer pattern with curried map
- ⏳ Extended acceptance tests for composition and edge cases
- ⏳ Type-level tests for progressive inference
- ⏳ LazyRecords SQL introspection validation

### Verification Process:

#### Pre-commit (Local):
1. `./run check` - type checking
2. `./run test packages/totallylazy/test/functions/curry.test.ts` - curry tests
3. If modifying transducers: `./run test packages/totallylazy/test/transducers/` and `./run test packages/lazyrecords/test/`

#### Build:
1. `gh run watch` - wait for CI/CD

#### Post-deployment:
1. `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score` - verify JSR score remains 100%

## Performance Considerations

- Proxy overhead: acceptable for correctness-first approach
- Parameter name parsing via regex: happens once per curry call
- Property access via Proxy `get` trap: minimal overhead
- Future optimization: cache parsed parameter names if needed

## Future Enhancements

### Type System:
- Progressive type refinement as arguments are applied
- Type-safe property names (challenging without template literal types for parameter names)

### Additional Features (deferred):
- Named argument object notation

## References

- Original research: `thoughts/shared/research/2025-10-31-6-curried-partial-application-proxy.md`
- Issue: #6 (curried/partial application function proxy)
- Transducer pattern: `packages/totallylazy/src/transducers/Transducer.ts:20-25`
- LazyRecords SQL conversion: `packages/lazyrecords/src/sql/builder/builders.ts:42-64`
- Ramda curry reference: `/home/dan/Projects/ramda/source/curry.js`
