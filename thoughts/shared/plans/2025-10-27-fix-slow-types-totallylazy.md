# Fix Slow Types for @bodar/totallylazy JSR Publishing Implementation Plan

## Overview

Enable publishing of @bodar/totallylazy package to JSR by fixing slow type issues that JSR flags during publication. This will allow totallylazy to be published alongside yadic and later enable lazyrecords publishing (which depends on totallylazy).

## Current State Analysis

**Already Published to JSR:**
- @bodar/yadic - Successfully published with 100% JSR score, "No slow types (5/5)"

**Target for This Plan:**
- @bodar/totallylazy - Contains slow type patterns that will be flagged by JSR

**Future Work (Out of Scope):**
- @bodar/lazyrecords - Depends on totallylazy, will be addressed in a separate plan after totallylazy is successfully published

**Key Slow Type Issues Found in totallylazy:**
1. **Function overloads with 6+ variants** (`Sequence.ts:28-34`, `Parser.ts:30-36`)
2. **Complex conditional types with infer** (`ListParser.ts:24-31`)
3. **Mapped types with indexed access** (`ListParser.ts:31`)

### Key Discoveries:
- Commit 616c5865 previously fixed slow types in yadic by adding explicit return types
- The publish script (`run:87-106`) currently only publishes yadic
- totallylazy has a comprehensive README already created (issue #5)
- Package structure was recently standardized with exports defined in `packages/totallylazy/package.json`
- totallylazy has 69 exports across predicates, parsers, transducers, functions, comparators, asserts, collections, and grammars

## Desired End State

After implementation:
1. @bodar/totallylazy can be published to JSR without slow type errors
2. The package achieves "No slow types (5/5)" on its JSR score
3. The publish script includes both yadic and totallylazy packages
4. lazyrecords is explicitly left for future work

### Verification:
- Build succeeds without slow type warnings
- JSR publish completes successfully for totallylazy
- JSR score shows 5/5 for "No slow types":
  - Check: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`

## What We're NOT Doing

- **Not changing functionality** - Only adding type annotations
- **Not refactoring code structure** - Preserving existing implementation
- **Not removing overloads** - Adding explicit return types instead
- **Not modifying tests** - All tests should continue to pass unchanged
- **Not changing public API** - Type signatures remain compatible
- **Not publishing lazyrecords yet** - That's a separate effort after totallylazy succeeds

## Implementation Approach

First test JSR publishing to identify the specific slow type issues, then fix them incrementally by adding explicit type annotations following the pattern from commit 616c5865 for yadic. This approach allows us to see the actual errors JSR reports before attempting fixes.

## Phase 1: Test JSR Publishing for totallylazy

### Overview
Update the publish script to include totallylazy and test JSR publishing to identify the actual slow type errors.

### Changes Required:

#### 1. Update Publish Script
**File**: `run`
**Line**: 91

**Current**:
```typescript
// Only publish yadic package
for await (const f of new Glob("packages/yadic/package.json").scan(".")) {
```

**After**:
```typescript
// Publish yadic and totallylazy packages
for await (const f of new Glob("packages/{yadic,totallylazy}/package.json").scan(".")) {
```

#### 2. Update Comment
Update the comment to reflect that we're publishing both packages:
```typescript
// Publish yadic and totallylazy packages (lazyrecords pending totallylazy publication)
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Script syntax is correct: `./run check`
- [ ] All tests pass: `./run test`
- [ ] Build succeeds: `./run build`

**Implementation Note**: After all verification passes, commit and push changes to trigger CI/CD to see what slow type errors JSR reports.

#### Build Verification:
- [ ] CI/CD build completes: `gh run watch`
- [ ] Check JSR publish output for slow type errors in CircleCI logs
- [ ] Document the specific slow type issues reported by JSR

**Next Steps**: After Phase 1 completes, use the JSR build logs to determine which phase to do next. If JSR reports Sequence issues first, start with Phase 3. If it reports Parser issues first, start with Phase 2. If it reports ListParser issues first, start with Phase 4. Work through the phases based on the actual errors JSR reports.

---

## Phase 2: Fix Function Overloads in totallylazy/parsers/Parser.ts

### Overview
Add explicit return type annotations to parser function with 6 overloads to help TypeScript resolve types faster.

### Changes Required:

#### 1. Verify Parser.ts Overloads Have Explicit Return Types
**File**: `packages/totallylazy/src/parsers/Parser.ts`
**Lines**: 30-36

Verify each overload has explicit `: Parser<A, X>` return type. If any are missing, add them:

```typescript
export function parser<A, B>(a: Parser<A, B>): Parser<A, B>;
export function parser<A, B, C>(a: Parser<A, B>, b: Step<A, B, C>): Parser<A, C>;
export function parser<A, B, C, D>(a: Parser<A, B>, b: Step<A, B, C>, c: Step<A, C, D>): Parser<A, D>;
// ... etc for all 6 overloads
```

Ensure the implementation signature also has explicit return type:
```typescript
export function parser(...args: any[]): Parser<any, any> {
    // Implementation
}
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] Tests pass: `./run test`
- [ ] Build succeeds: `./run build`

**Implementation Note**: Commit after verification with message like "Add explicit return types to parser overloads".

#### Build Verification:
- [ ] CI/CD build completes successfully
- [ ] No slow type warnings in build

---

## Phase 3: Fix Function Overloads in totallylazy/collections/Sequence.ts

### Overview
Add explicit return type annotations to sequence function with 6 overloads.

### Changes Required:

#### 1. Verify Sequence.ts Overloads Have Explicit Return Types
**File**: `packages/totallylazy/src/collections/Sequence.ts`
**Lines**: 28-34

Verify each overload has explicit `: Sequence<X>` return type. Add if missing:

```typescript
export function sequence<A>(a: Iterable<A>): Sequence<A>;
export function sequence<A, B>(a: Iterable<A>, b: Transducer<A, B>): Sequence<B>;
export function sequence<A, B, C>(a: Iterable<A>, b: Transducer<A, B>, c: Transducer<B, C>): Sequence<C>;
// ... etc for all 6 overloads
```

Ensure implementation has explicit return type:
```typescript
export function sequence(...args: any[]): Sequence<any> {
    // Implementation
}
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] Tests pass: `./run test`
- [ ] Build succeeds: `./run build`

**Implementation Note**: Commit after verification with message like "Add explicit return types to sequence overloads".

#### Build Verification:
- [ ] CI/CD build completes
- [ ] No slow type warnings

---

## Phase 4: Fix Slow Types in totallylazy/parsers/ListParser.ts

### Overview
Add explicit return types to parser functions that use complex conditional types and infer patterns. This is the most complex slow type issue.

### Changes Required:

#### 1. Fix list() Function
**File**: `packages/totallylazy/src/parsers/ListParser.ts`
**Line**: 27

**Current**:
```typescript
export function list<P extends Parser<any, any>[]>(...parsers: P): Parser<InferInput<P[number]>, InferResult<P[number]>[]>
```

**After** - Add explicit type calculation within function:
```typescript
export function list<P extends Parser<any, any>[]>(...parsers: P): Parser<InferInput<P[number]>, InferResult<P[number]>[]> {
    type Input = InferInput<P[number]>;
    type Result = InferResult<P[number]>[];
    // Implementation remains the same, add type assertion at return if needed
    return ... as Parser<Input, Result>;
}
```

#### 2. Fix tuple() Function
**File**: `packages/totallylazy/src/parsers/ListParser.ts`
**Line**: 31

**Current**:
```typescript
export function tuple<P extends Parser<any, any>[]>(...parsers: P): Parser<InferInput<P[number]>, { [I in keyof P]: InferResult<P[I]> }>
```

**After** - Add explicit type calculation:
```typescript
export function tuple<P extends Parser<any, any>[]>(...parsers: P): Parser<InferInput<P[number]>, { [I in keyof P]: InferResult<P[I]> }> {
    type Input = InferInput<P[number]>;
    type Result = { [I in keyof P]: InferResult<P[I]> };
    // Implementation, add type assertion at return if needed
    return ... as Parser<Input, Result>;
}
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] Tests pass: `./run test`
- [ ] Build succeeds: `./run build`

**Implementation Note**: After pre-commit verification passes, commit changes with message describing the fix (e.g., "Fix slow types in ListParser by adding explicit type annotations").

#### Build Verification:
- [ ] CI/CD build completes: Monitor CircleCI
- [ ] No TypeScript errors in build logs

---

## Testing Strategy

### Unit Tests:
- All existing tests must continue to pass
- No test modifications should be needed
- Run full test suite after each phase: `./run test`

### Integration Tests:
- Test package imports work correctly after publishing
- Verify type inference still works for consumers

### Manual Verification:
1. Check TypeScript compilation time doesn't increase significantly
2. Verify IDE autocomplete still works properly
3. After publishing, test imports from JSR in a separate test project

### JSR Score Verification Commands

**Check current score**:
```bash
curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score | grep -o '[0-9]*%'
```

**Check detailed breakdown**:
```bash
curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score
```

## Performance Considerations

- Adding explicit type annotations reduces TypeScript's type inference work
- This should improve compilation speed for both the library and consumers
- No runtime performance impact (types are compile-time only)
- Type-checking during development may be faster with explicit types

## Migration Notes

For consumers of totallylazy:
- No breaking changes - type signatures remain compatible
- May see improved TypeScript performance in their projects
- IDE autocomplete might be faster with explicit types
- Package will be available via JSR in addition to any existing distribution methods

## References

- Original issue: GitHub #5 (README creation, already completed)
- Related issue: GitHub #2 (JSR score improvement for yadic)
- Slow types fix commit for yadic: 616c5865eb7119aebbb8c36b09c8cf6bf115385a
- JSR slow types documentation: https://jsr.io/docs/about-slow-types
- Package locations:
  - `packages/totallylazy/src/parsers/ListParser.ts:24-31`
  - `packages/totallylazy/src/parsers/Parser.ts:30-36`
  - `packages/totallylazy/src/collections/Sequence.ts:28-34`
- Publish script: `run:87-106`
- Package manifest: `packages/totallylazy/package.json:1-75`

## Future Work

After totallylazy is successfully published to JSR:
- Create a separate plan for publishing @bodar/lazyrecords
- lazyrecords will be able to use the JSR-published version of totallylazy
- This separation reduces risk and allows testing totallylazy independently first