# Curry Placeholder Type Support Implementation Plan

## Overview

Update the TypeScript type definitions for the curry function to properly handle placeholder symbols (`_`) in the `RemainingParameters` type. This will ensure type checking correctly identifies which parameters remain unfilled when placeholders are used in partial application.

## Current State Analysis

The runtime curry implementation already correctly handles placeholders - when `_` is passed as an argument, that parameter position remains unfilled. However, the TypeScript type system doesn't recognize this, causing type errors when using placeholders in curry.test.ts.

### Key Discoveries:
- Runtime behavior works correctly (`packages/totallylazy/src/functions/curry.ts:46-47`)
- `RemainingParameters` type treats all arguments as filling parameters, including placeholders
- Test file `curry.check.ts:47-49` has a failing assertion for placeholder handling
- `curry.test.ts` has type errors on lines 77, 90, and 102 due to placeholder type mismatches

## Desired End State

After implementation, the `RemainingParameters` type should:
- Correctly identify when a `Placeholder` is in the applied parameters
- Keep that parameter position in the remaining parameters list
- Allow the type system to properly validate placeholder usage in tests

### Verification:
- All type checks pass: `./run check` returns no errors
- Test assertion at `curry.check.ts:47-49` passes
- No type errors in `curry.test.ts` related to placeholder usage

## What We're NOT Doing

- Modifying runtime behavior in `curry.ts` (it already works correctly)
- Changing the public API or how users interact with curry
- Altering test logic or assertions (only fixing type checking)
- Modifying the Curried type itself (only RemainingParameters needs updating)

## Implementation Approach

Update the `RemainingParameters` type to check if the head of `AppliedParams` is a `Placeholder`. If it is, keep that parameter in the result and continue processing. If not, consume both the applied and expected parameter as before.

## Phase 1: Update RemainingParameters Type

### Overview
Modify the `RemainingParameters` type definition to detect and handle `Placeholder` types in the applied parameters.

### Changes Required:

#### 1. Update RemainingParameters Type
**File**: `packages/totallylazy/src/functions/curry.types.ts`
**Changes**: Replace the existing `RemainingParameters` type with a version that handles placeholders

```typescript
export type RemainingParameters<AppliedParams extends any[], ExpectedParams extends any[]> =
    AppliedParams extends [infer AHead, ...infer ATail]
        ? ExpectedParams extends [infer EHead, ...infer ETail]
            ? AHead extends Placeholder
                ? [EHead, ...RemainingParameters<ATail, ETail>]
                : RemainingParameters<ATail, ETail>
            : []
        : ExpectedParams;
```

The key change is the addition of `AHead extends Placeholder` conditional:
- If the applied parameter is a placeholder, keep the expected parameter (`EHead`) in the result
- Otherwise, consume both parameters as before

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] Tests pass: `./run test packages/totallylazy/test/functions/curry.test.ts`
- [ ] Build succeeds: `./run build`
- [ ] Verify placeholder type assertion passes at `curry.check.ts:47-49`
- [ ] Verify no type errors in `curry.test.ts` lines 77, 90, 102

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [ ] CI/CD build completes successfully: `gh run watch` (wait for build to finish)
- [ ] All build steps pass: Review build logs if any failures occur
- [ ] If build fails: Fix issues, commit, push, and verify build succeeds before proceeding

#### Post-deployment Verification (Production):
After build succeeds:
- [ ] JSR Score remains at 100%: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`
- [ ] Package is published successfully to JSR

---

## Phase 2: Verify Comprehensive Type Coverage

### Overview
Ensure all curry placeholder scenarios are properly type-checked, including edge cases with multiple placeholders and default parameters.

### Changes Required:

#### 1. Add Additional Type Assertions (if needed)
**File**: `packages/totallylazy/test/functions/curry.check.ts`
**Changes**: Add any additional test cases to verify edge cases

```typescript
// Test multiple placeholders
assertType<Equal<
    RemainingParameters<[Placeholder, number, Placeholder], [string, number, boolean]>,
    [string, boolean]
>>(true);

// Test placeholder at end
assertType<Equal<
    RemainingParameters<[string, Placeholder], [string, number]>,
    [number]
>>(true);
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] All new type assertions pass: `./run check`
- [ ] Existing tests continue to pass: `./run test`

---

## Testing Strategy

### Type Tests:
- Verify `RemainingParameters` correctly handles single placeholder
- Verify multiple placeholders in different positions
- Verify placeholder at beginning, middle, and end of parameters
- Verify interaction with default parameters

### Runtime Tests:
- All existing runtime tests in `curry.test.ts` should continue to pass
- Type checking should no longer produce errors for placeholder usage

### Local Verification (Pre-commit):
1. Run type check: `./run check`
2. Run curry tests: `./run test packages/totallylazy/test/functions/curry.test.ts`
3. Run all tests: `./run test`

### Build Verification (After commit/push):
1. Wait for CI/CD build: `gh run watch`
2. Verify build passes: Review logs if failures occur

### Production Verification (After build succeeds):
1. Check JSR score: `curl -H 'accept: text/html' https://jsr.io/@bodar/totallylazy/score`
2. Verify score remains at 100%

## Performance Considerations

This is a type-level change only - no runtime performance impact. The recursive type resolution may slightly increase TypeScript compilation time, but the impact should be negligible.

## Migration Notes

No migration needed - this is a type-system fix that makes the types match existing runtime behavior. Existing code using curry with placeholders will gain proper type safety without changes.

## References

- Original implementation inspired by: "Creating a Type Safe Curry Function with Typescript" by Patrick Trasborg (Medium)
- Type assertion library: https://github.com/rauschma/asserttt
- Runtime implementation: `packages/totallylazy/src/functions/curry.ts:45-47`
- Type tests: `packages/totallylazy/test/functions/curry.check.ts`