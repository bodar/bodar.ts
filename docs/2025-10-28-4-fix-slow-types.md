# Fix Slow Types for JSR Publishing - Implementation Plan

## Overview

Fix the slow type errors reported by JSR during the GitHub Actions build to enable publishing of the lazyrecords package. This involves adding explicit type annotations to functions and static properties in the public API.

## Current State Analysis

The GitHub Actions build is failing with 12 slow type errors from JSR:
- 2 functions missing explicit return types
- 10 static properties/constants missing explicit type annotations

All errors are in the `packages/lazyrecords/src/sql` directory.

## Desired End State

The build should pass with:
- All functions having explicit return type annotations
- All exported constants and static properties having explicit type annotations
- JSR publishing succeeding for the lazyrecords package
- Issue #4 can be closed

## What We're NOT Doing

- Fixing any other issues beyond the 12 slow type errors
- Refactoring code structure or functionality
- Adding tests or documentation
- Modifying totallylazy or yadic packages

## Implementation Approach

Add explicit type annotations to exactly the 12 locations identified by JSR. No other changes.

## Phase 1: Fix Function Return Types

### Overview
Add explicit return type annotations to two functions in the postgres module.

### Changes Required:

#### 1. prepareStatement function
**File**: `packages/lazyrecords/src/sql/postgres/prepareStatement.ts`
**Changes**: Add return type annotation on line 10

```typescript
export async function prepareStatement(sql: Sql, name?: string): Promise<{ name: string; text: string; args: unknown[] }> {
```

#### 2. statement function
**File**: `packages/lazyrecords/src/sql/postgres/statement.ts`
**Changes**: Add return type annotation on line 15

```typescript
export function statement(sql: Sql): { text: string; args: unknown[] } {
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Type checking passes: `./run check`
- [x] Tests pass: `./run test`
- [x] Build succeeds: `./run build`

## Phase 2: Fix Static Property Types

### Overview
Add explicit type annotations to static class properties and exported constants.

### Changes Required:

#### 1. Aliased class
**File**: `packages/lazyrecords/src/sql/ansi/Aliased.ts`
**Changes**:
1. Update import to include Text type
2. Add type annotation to static property on line 7

```typescript
import {text, Text} from "../template/Text.ts";
// ...
static as: Text = text("as");
```

#### 2. Column module
**File**: `packages/lazyrecords/src/sql/ansi/Column.ts`
**Changes**:
1. Update import to include Text type
2. Add type annotation to exported constant on line 14

```typescript
import {text, Text} from "../template/Text.ts";
// ...
export const star: Text = text('*');
```

#### 3. FromClause class
**File**: `packages/lazyrecords/src/sql/ansi/FromClause.ts`
**Changes**:
1. Update import to include Text type
2. Add type annotation to static property on line 6

```typescript
import {text, Text} from "../template/Text.ts";
// ...
static from: Text = text("from");
```

#### 4. IsExpression class
**File**: `packages/lazyrecords/src/sql/ansi/IsExpression.ts`
**Changes**:
1. Update import to include Text type
2. Add type annotations to static properties on lines 7-8

```typescript
import {text, Text} from "../template/Text.ts";
// ...
static equals: Text = text("=");
static is: Text = text("is");
```

#### 5. Qualified class
**File**: `packages/lazyrecords/src/sql/ansi/Qualified.ts`
**Changes**:
1. Update import to include Text type
2. Add type annotation to static property on line 6

```typescript
import {text, Text} from "../template/Text.ts";
// ...
static dot: Text = text(".");
```

#### 6. SelectExpression class
**File**: `packages/lazyrecords/src/sql/ansi/SelectExpression.ts`
**Changes**:
1. Update import to include Text type
2. Add type annotation to static property on line 25

```typescript
import {text, Text} from "../template/Text.ts";
// ...
static select: Text = text("select");
```

#### 7. SetQuantifier class
**File**: `packages/lazyrecords/src/sql/ansi/SetQuantifier.ts`
**Changes**: Add type annotations to static properties on lines 4-5

```typescript
static All: SetQuantifier = new SetQuantifier('all');
static Distinct: SetQuantifier = new SetQuantifier('distinct');
```

#### 8. WhereClause class
**File**: `packages/lazyrecords/src/sql/ansi/WhereClause.ts`
**Changes**:
1. Update import to include Text type
2. Add type annotation to static property on line 10

```typescript
import {text, Text} from "../template/Text.ts";
// ...
static where: Text = text("where");
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [x] Type checking passes: `./run check`
- [x] Tests pass: `./run test`
- [x] Build succeeds: `./run build`

**Implementation Note**: After all pre-commit verification passes, pause and request human approval to commit and push changes.

#### Build Verification:
- [x] CI/CD build completes successfully: `gh run watch` (wait for build to finish)
- [x] All build steps pass: Review build logs if any failures occur
- [x] JSR publishing succeeds for lazyrecords package (commit a0d2428)

## Testing Strategy

### Pre-commit Tests:
- Run type checking to ensure all types are explicit
- Run existing unit tests to ensure no functionality is broken
- Run build to verify everything compiles

### Build Verification:
1. Wait for GitHub Actions build: `gh run watch`
2. Verify JSR publishing succeeds for lazyrecords package
3. If any slow type errors remain, fix them and repeat

## Performance Considerations

None - these are compile-time type annotations only.

## Migration Notes

None - these changes are backward compatible and don't affect runtime behavior.

## References

- Original issue: [GitHub #4](https://github.com/bodar/bodar.ts/issues/4)
- JSR slow type documentation: https://jsr.io/go/slow-type-missing-explicit-return-type
- JSR type documentation: https://jsr.io/go/slow-type-missing-explicit-type