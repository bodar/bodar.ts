# Increase lazyrecords JSR Score to 100%

## Progress Summary

**Start:** 8/17 points (47%), 31% symbols documented
**Target:** 16-17/17 points (94-100%), 80%+ symbols documented

### Current State:
- ✅ No slow types (5/5 points)
- ✅ At least one runtime compatible (1/1 point)
- ✅ Has provenance (1/1 point) - Already using GitHub Actions
- ⚠️ Has docs for most symbols - Currently only 31% documented (1/5 points)
- ❌ Has a readme or module doc (0/2 points) - README exists but not published
- ❌ Has examples in readme (0/1 point) - README has examples but not published
- ❌ Has module docs in all entrypoints (0/1 point)
- ❌ Has a description (0/1 point)
- ❌ At least two runtimes compatible (0/1 point)

## Overview

Improve the JSR score for @bodar/lazyrecords from 47% to 100% by fixing README publishing, adding missing documentation, and configuring package metadata. Following the successful approach used for @bodar/yadic and @bodar/totallylazy, we'll incrementally add documentation and verify improvements through CircleCI builds.

## Current State Analysis

**Current JSR Score: 47%** (based on https://jsr.io/@bodar/lazyrecords/score)

### Passing Criteria (8/17 points):
- ✅ No slow types are used (5/5)
- ✅ At least one runtime is marked as compatible (1/1)
- ✅ Has provenance (1/1) - Already using GitHub Actions
- ⚠️ Has docs for most symbols - 31% documented (1/5)

### Failing Criteria (0/9 points):
- ❌ Has a readme or module doc (0/2) - **README exists but not published to JSR**
- ❌ Has examples in the readme or module doc (0/1) - **README has examples but not published**
- ❌ Has module docs in all entrypoints (0/1)
- ❌ Has a description (0/1)
- ❌ At least two runtimes are marked as compatible (0/1)

### Key Discoveries:
- Package has 24 exported entrypoints
- **71 total exported symbols**, 22 documented (31%), 49 undocumented (69%)
- README.md exists at `packages/lazyrecords/README.md` with 10 code examples
- **Critical Issue**: `package.json` files array excludes `README.md` (packages/lazyrecords/package.json:37-41)
- Already documented modules: PostgresRecords, Sql, Text, Identifier, Expression (partial: Compound)
- Need to add 49% more symbol coverage to reach 80% threshold

### Export Breakdown by Module:
- **sql/builder/** - 8 exports, 0% documented
- **sql/postgres/** - 4 exports, 50% documented (PostgresRecords done, prepareStatement/statement need docs)
- **sql/ansi/** - 29 exports, 0% documented (11 entrypoint files)
- **sql/template/** - 30 exports, 73% documented (Compound partially done, Value undocumented)

## Desired End State

**Target: 94-100% JSR Score** (16-17/17 points)
- README.md published to JSR (+2 points)
- README examples visible on JSR (+1 point)
- All 24 entrypoints have proper module documentation (+1 point)
- At least 80% of 71 exported symbols documented (+4 points, reaching 5/5 total)
- Package has a description (+1 point)
- At least 2 runtimes marked as compatible (+1 point)
- **Provenance already complete** (+1 point) - No action needed

### Verification:
- JSR Score endpoint: `curl -s https://api.jsr.io/scopes/bodar/packages/lazyrecords/score`
- JSR Score page: `curl -H 'accept: text/html' https://jsr.io/@bodar/lazyrecords/score`
- CircleCI build status via MCP server after each push

## What We're NOT Doing

- Not migrating from GitHub Actions (already have provenance)
- Not changing package functionality or API
- Not modifying existing well-documented files
- Not adding documentation to test files
- Not refactoring code structure

## Implementation Approach

Follow the incremental approach from yadic and totallylazy:
1. Make one logical change per commit
2. Push and wait for CircleCI build
3. Check build status via CircleCI MCP server
4. Verify JSR score impact via API endpoint
5. If no impact after 2 checks, move to next item

Start with highest-impact items first (README publishing, package description, then symbol docs).

---

## Phase 1: Fix README Publishing

### Overview
Add README.md to the files array in package.json so it gets published to JSR. This will immediately gain 3 points (+2 for README, +1 for examples).

### Changes Required:

#### 1. Package Files Configuration
**File**: `packages/lazyrecords/package.json`
**Changes**: Add README.md to files array

**Current** (lines 37-41):
```json
"files": [
  "src/**/*.ts",
  "!src/**/*.test.ts",
  "package.json"
]
```

**After**:
```json
"files": [
  "src/**/*.ts",
  "!src/**/*.test.ts",
  "README.md",
  "package.json"
]
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] Tests pass: `./run test`
- [ ] Build succeeds: `./run build`

**Implementation Note**: After pre-commit verification passes, commit and push changes.

#### Build Verification:
- [ ] CircleCI build completes: Check via `mcp__circleci-mcp-server__get_latest_pipeline_status`
- [ ] Build passes: Review logs if failures occur

#### Post-deployment Verification (Production):
- [ ] README appears on JSR: `curl -H 'accept: text/html' https://jsr.io/@bodar/lazyrecords` (check for README content)
- [ ] JSR score updated: `curl -s https://api.jsr.io/scopes/bodar/packages/lazyrecords/score | jq .hasReadme`
- [ ] Expected result: `true`
- [ ] JSR score updated: `curl -s https://api.jsr.io/scopes/bodar/packages/lazyrecords/score | jq .hasReadmeExamples`
- [ ] Expected result: `true`
- [ ] Score should increase to ~65% (+3 points, from 8/17 to 11/17)

---

## Phase 2: Add Package Description

### Overview
Add package description to improve searchability and score +1 point.

### Changes Required:

#### 1. Package Metadata
**File**: `packages/lazyrecords/package.json`
**Changes**: Add description field after version

```json
{
  "name": "@bodar/lazyrecords",
  "version": "0.0.0",
  "description": "Type-safe SQL query builder for TypeScript with support for PostgreSQL, template literals, and ANSI SQL standard",
  "type": "module",
  ...
}
```

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] Tests pass: `./run test`

**Implementation Note**: After pre-commit verification passes, commit and push changes.

#### Build Verification:
- [ ] CircleCI build completes: Check via `mcp__circleci-mcp-server__get_latest_pipeline_status`
- [ ] Build passes: Review logs if failures occur

#### Post-deployment Verification (Production):
- [ ] JSR score updated: `curl -s https://api.jsr.io/scopes/bodar/packages/lazyrecords/score | jq .hasDescription`
- [ ] Expected result: `true`
- [ ] Score should increase to ~71% (+1 point, from 11/17 to 12/17)

---

## Phase 3: Add Runtime Compatibility

### Overview
Mark package as compatible with multiple runtimes to score +1 point.

### Changes Required:

Runtime compatibility must be marked via JSR web interface at:
https://jsr.io/@bodar/lazyrecords/settings

Mark as compatible with:
- Bun (already marked)
- Deno
- Node.js

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Log into JSR web interface
- [ ] Navigate to package settings
- [ ] Mark additional runtimes as compatible

#### Post-deployment Verification (Production):
- [ ] JSR score updated: `curl -s https://api.jsr.io/scopes/bodar/packages/lazyrecords/score | jq .multipleRuntimesCompatible`
- [ ] Expected result: `true`
- [ ] Score should increase to ~76% (+1 point, from 12/17 to 13/17)

---

## Phase 4: Add Module Documentation to All Entrypoints

### Overview
Add @module JSDoc to all 24 entrypoints that lack module-level documentation. This addresses the "Has module docs in all entrypoints" criterion (+1 point).

### Files Needing Module Documentation:

**Pattern to follow**: Look at existing module docs in `packages/lazyrecords/src/sql/template/Sql.ts` and `packages/lazyrecords/src/sql/postgres/PostgresRecords.ts`

#### 1. Builder Module (1 file)
- `packages/lazyrecords/src/sql/builder/builders.ts`

#### 2. Postgres Module (2 files)
- `packages/lazyrecords/src/sql/postgres/prepareStatement.ts`
- `packages/lazyrecords/src/sql/postgres/statement.ts`

#### 3. ANSI Module (11 files)
- `packages/lazyrecords/src/sql/ansi/SetQuantifier.ts`
- `packages/lazyrecords/src/sql/ansi/escape.ts`
- `packages/lazyrecords/src/sql/ansi/PredicateExpression.ts`
- `packages/lazyrecords/src/sql/ansi/SelectList.ts`
- `packages/lazyrecords/src/sql/ansi/Table.ts`
- `packages/lazyrecords/src/sql/ansi/Column.ts`
- `packages/lazyrecords/src/sql/ansi/Aliasable.ts`
- `packages/lazyrecords/src/sql/ansi/IsExpression.ts`
- `packages/lazyrecords/src/sql/ansi/WhereClause.ts`
- `packages/lazyrecords/src/sql/ansi/Aliased.ts`
- `packages/lazyrecords/src/sql/ansi/FromClause.ts`
- `packages/lazyrecords/src/sql/ansi/SelectExpression.ts`
- `packages/lazyrecords/src/sql/ansi/Qualified.ts`

#### 4. Template Module (4 files - some already have docs)
- `packages/lazyrecords/src/sql/template/mod.ts` (need to verify)
- `packages/lazyrecords/src/sql/template/Compound.ts` (verify if has @module)
- `packages/lazyrecords/src/sql/template/Value.ts`
- Already documented: Expression.ts, Identifier.ts, Text.ts, Sql.ts

### Changes Required:

Read each file and add appropriate @module JSDoc documentation based on:
- Test files to understand usage
- Existing patterns from PostgresRecords and Sql modules
- Actual exported functionality

**Commit strategy**: Group by module directory (e.g., all ANSI files in 2-3 commits, template files together, etc.)

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] Tests pass: `./run test`
- [ ] Review module docs are accurate based on tests

#### Build Verification:
- [ ] CircleCI build completes successfully

#### Post-deployment Verification (Production):
- [ ] JSR score updated: `curl -s https://api.jsr.io/scopes/bodar/packages/lazyrecords/score | jq .allEntrypointsDocs`
- [ ] Expected result: `true`
- [ ] Score should increase to ~82% (+1 point, from 13/17 to 14/17)

---

## Phase 5: Add Symbol Documentation - High Priority Files

### Overview
Document the most commonly used exported symbols to progress toward 80% documentation threshold. Focus on builder, ANSI, and template modules with the most undocumented exports.

**Current Status: 22/71 symbols documented (31%)**
**Target: 57/71 symbols documented (80%)** - Need to document **35 more symbols**

### Priority 1: Builder Module (8 symbols)

#### Files:
- `packages/lazyrecords/src/sql/builder/builders.ts`

**Exports to document**:
- `Definition<A>` interface
- `definition()` function
- `Supported<A>` type
- `toSelect()` function (6 overloads)
- `toSelectList()` function
- `toColumn()` function
- `toFromClause()` function
- `toPredicand()` function
- `toCompound()` function

**Pattern to follow**: Look at documented functions in Compound.ts and Sql.ts

**Tests to reference**: `packages/lazyrecords/test/sql/builder/builders.test.ts`

### Priority 2: ANSI Core Modules (15 symbols)

#### Files:
- `packages/lazyrecords/src/sql/ansi/Table.ts` - 3 exports
- `packages/lazyrecords/src/sql/ansi/Column.ts` - 4 exports
- `packages/lazyrecords/src/sql/ansi/WhereClause.ts` - 4 exports
- `packages/lazyrecords/src/sql/ansi/SelectExpression.ts` - 3 exports
- `packages/lazyrecords/src/sql/ansi/FromClause.ts` - 2 exports

**Pattern to follow**: PostgresRecords.ts for classes, existing template functions for function docs

**Tests to reference**:
- `test/sql/ansi/Table.test.ts`
- `test/sql/ansi/Column.test.ts`
- `test/sql/ansi/SelectExpression.test.ts`

### Priority 3: Remaining ANSI & Template (12 symbols)

#### Files:
- `packages/lazyrecords/src/sql/ansi/SetQuantifier.ts` - 3 exports
- `packages/lazyrecords/src/sql/ansi/escape.ts` - 2 exports
- `packages/lazyrecords/src/sql/template/Value.ts` - 2 exports
- `packages/lazyrecords/src/sql/template/Compound.ts` - 5 undocumented (values, and, or, not, between)

**Commit strategy**: Group similar types (classes together, utility functions together) in commits of 5-8 symbols each.

### Success Criteria:

#### Pre-commit Verification (Local):
- [ ] Type checking passes: `./run check`
- [ ] Tests pass: `./run test`
- [ ] Each symbol has JSDoc with description and @example

#### Build Verification:
- [ ] CircleCI build completes successfully

#### Post-deployment Verification (Production):
- [ ] JSR score updated: `curl -s https://api.jsr.io/scopes/bodar/packages/lazyrecords/score | jq .percentageDocumentedSymbols`
- [ ] Target: Reach 0.80 (80%) or higher
- [ ] Score should increase to 94-100% (16-17/17 points total)
  - At 60% symbols: +2 points (15/17, 88%)
  - At 80% symbols: +4 points (17/17, 100%) - assuming allEntrypointsDocs is true

**Strategy**: Monitor JSR score after each commit batch. The scoring thresholds are:
- 0-20%: 0 points
- 20-40%: 1 point (currently at 31%)
- 40-60%: 2 points
- 60-80%: 3 points
- 80-100%: 5 points

---

## Testing Strategy

### Unit Tests:
- All existing tests must continue to pass
- No new tests required (documentation-only changes)
- Use tests to understand functionality for accurate documentation

### Local Verification (Pre-commit):
1. Type check: `./run check`
2. Run tests: `./run test`
3. Review JSDoc syntax is correct
4. Build: `./run build` (if applicable)

### Build Verification (After commit/push):
1. Wait 30 seconds for CircleCI to start
2. Check build status: Use CircleCI MCP server `get_latest_pipeline_status`
3. Review build logs if failures occur
4. Fix issues and commit again if needed

### Production Verification (After build succeeds):
1. Check score API: `curl -s https://api.jsr.io/scopes/bodar/packages/lazyrecords/score`
2. Check score page: `curl -H 'accept: text/html' https://jsr.io/@bodar/lazyrecords/score`
3. Verify specific criteria changed (e.g., `hasReadme`, `percentageDocumentedSymbols`)
4. If no change after 2 verification cycles, move to next phase

## Performance Considerations

- Documentation changes have no runtime performance impact
- Build times may increase slightly with more JSDoc parsing
- JSR score updates may take 30-60 seconds after successful publish

## Migration Notes

Not applicable - documentation-only changes, no breaking changes to API.

## References

- Previous plans:
  - `thoughts/shared/plans/2025-10-27-totallylazy-jsr-score-100.md` - totallylazy (14/17, 82%)
  - `thoughts/shared/plans/2025-10-24-issue-2-jsr-score-improvement.md` - yadic (17/17, 100%)
- JSR Score page: https://jsr.io/@bodar/lazyrecords/score
- JSR Score API: https://api.jsr.io/scopes/bodar/packages/lazyrecords/score
- JSR Documentation guide: https://jsr.io/docs/writing-docs
- Package location: `packages/lazyrecords/`
- Package exports: `packages/lazyrecords/package.json:11-36`
- Already documented examples: `packages/lazyrecords/src/sql/template/*.ts` and `packages/lazyrecords/src/sql/postgres/PostgresRecords.ts`
