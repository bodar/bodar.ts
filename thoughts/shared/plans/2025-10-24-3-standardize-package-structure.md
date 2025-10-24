# Standardize Package Structure Implementation Plan

## Overview

Move package.json files from `packages/*/src/` to `packages/*/` (package roots) to follow standard npm/JSR package structure conventions. Use wildcard exports for minimal disruption while maintaining all existing import patterns.

## Current State Analysis

The monorepo currently has a non-standard structure:

**Current locations:**
- `packages/yadic/src/package.json`
- `packages/totallylazy/src/package.json`
- `packages/lazyrecords/src/package.json`
- Test directories also have package.json: `packages/*/test/package.json`

**Key characteristics:**
- 3 packages: yadic (3 files), totallylazy (81 files), lazyrecords (24 files)
- 43 total test files across all packages
- Workspace config points to `packages/**/src` and `packages/**/test`
- Inter-package imports use full paths: `@bodar/totallylazy/functions/Mapper.ts`
- Publish script searches in `packages/yadic/src/package.json`
- Only yadic is currently published to JSR

## Desired End State

**Target structure:**
```
packages/yadic/
├── package.json          ← moved here from src/
├── src/
│   ├── chain.ts
│   ├── LazyMap.ts
│   └── types.ts
└── test/
    └── *.test.ts (no package.json)
```

**Verification:**
- All 43 tests pass locally
- TypeScript compilation succeeds
- Published package on JSR imports correctly
- CircleCI build passes
- JSR page shows correct exports

## What We're NOT Doing

- Creating explicit exports for every file (using wildcard instead)
- Changing import paths anywhere in the codebase
- Publishing all packages (still only yadic)
- Changing the version numbering scheme
- Adding JSR score improvements (tracked in issue #4)

## Implementation Approach

Use wildcard exports pattern to minimize changes and maintain backward compatibility. Make atomic changes that can be verified at each step. All existing imports will continue to work without modification.

---

## Phase 1: Update yadic Package Structure

### Overview
Start with the smallest package (yadic, 3 files) to validate the approach before applying to larger packages.

### Changes Required:

#### 1. Move yadic package.json
**Action**: Move package.json from src/ to package root

```bash
git mv packages/yadic/src/package.json packages/yadic/package.json
```

#### 2. Update yadic package.json
**File**: `packages/yadic/package.json`
**Changes**: Add exports and files fields

**Note**: Initially tried wildcard exports `"./*": "./src/*.ts"`, but TypeScript's module resolution doesn't fully support wildcard patterns for workspace packages during type-checking (works at runtime with Bun, but `tsc --noEmit` fails). Using explicit exports instead.

```json
{
  "name": "@bodar/yadic",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./chain.ts": "./src/chain.ts",
    "./LazyMap.ts": "./src/LazyMap.ts",
    "./types.ts": "./src/types.ts"
  },
  "files": [
    "src/**/*.ts",
    "!src/**/*.test.ts"
  ]
}
```

#### 3. Update root workspace configuration
**File**: `package.json:4-7`
**Changes**: Update workspace globs to support both migrated and un-migrated packages

```json
"workspaces": [
  "packages/*",
  "packages/**/src",
  "packages/**/test"
]
```

**Note**: Must keep both `packages/*` (for migrated packages like yadic) and `packages/**/src` (for un-migrated packages like totallylazy, lazyrecords) during gradual migration. The `packages/**/src` pattern will be removed in Phase 4 after all packages are migrated. Also keeping `packages/**/test` since test directories still have their own package.json files.

#### 4. Update publish script
**File**: `run:58-80`
**Changes**:
1. Change glob pattern to find package.json at package root
2. Adjust TypeScript file scanning to look in `src/` subdirectory
3. Generate explicit exports for jsr.json (JSR doesn't support wildcard exports like `"./*"`)

**Note**: While package.json uses wildcard exports `"./*": "./src/*.ts"` for local workspace resolution, JSR requires explicit exports. The publish script generates these by scanning TypeScript files and creating individual export mappings.

**Current implementation:**
```typescript
export async function publish() {
    const v = await version();

    // Only publish yadic package
    for await (const f of new Glob("packages/yadic/src/package.json").scan(".")) {
        const packageJson = await file(f).json();
        const parent = dirname(f!);
        const jsrFile = file(join(parent, 'jsr.json'));
        const typescript = await toPromiseArray<string>(new Glob("./**/*.ts").scan(parent));
        if (typescript.length > 0) await write(jsrFile, JSON.stringify({
            name: packageJson.name,
            version: v,
            exports: typescript.reduce((a: any, ts: string) => {
                a[ts.replace(/\.ts$/, '')] = ts;
                return a;
            }, {}),
            license: 'Apache-2.0'
        }, null, 2));
    }

    await $`bunx jsr publish --allow-dirty --token ${process.env.JSR_TOKEN}`;
    await $`rm -rf **/jsr.json`;
}
```

**Updated implementation:**
```typescript
export async function publish() {
    const v = await version();

    // Only publish yadic package
    for await (const f of new Glob("packages/yadic/package.json").scan(".")) {
        const packageJson = await file(f).json();
        const parent = dirname(f!);
        const jsrFile = file(join(parent, 'jsr.json'));
        const srcDir = join(parent, 'src');
        const typescript = await toPromiseArray<string>(new Glob("./**/*.ts").scan(srcDir));
        if (typescript.length > 0) await write(jsrFile, JSON.stringify({
            name: packageJson.name,
            version: v,
            exports: typescript.reduce((a: any, ts: string) => {
                const key = ts.replace(/\.ts$/, '');  // Remove .ts from key
                const value = ts.replace('./', './src/');  // Replace ./ with ./src/ in value
                a[key] = value;
                return a;
            }, {}),
            license: 'Apache-2.0'
        }, null, 2));
    }

    await $`bunx jsr publish --allow-dirty --token ${process.env.JSR_TOKEN}`;
    await $`rm -rf **/jsr.json`;
}
```

**Key changes:**
- Line 62: `packages/yadic/package.json` instead of `packages/yadic/src/package.json`
- Line 65: Define `srcDir` as `join(parent, 'src')`
- Line 66: Scan from `srcDir` instead of `parent`
- Line 72-73: Remove `.ts` from keys, replace `./` with `./src/` in values

**Expected jsr.json output:**
```json
{
  "name": "@bodar/yadic",
  "version": "0.x.x",
  "exports": {
    "./chain": "./src/chain.ts",
    "./LazyMap": "./src/LazyMap.ts",
    "./types": "./src/types.ts"
  },
  "license": "Apache-2.0"
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `./run check`
- [x] All yadic tests pass: `./run test packages/yadic/test`
- [x] All tests across monorepo pass: `./run test`

#### Automated Verification (CI/CD):
- [x] Commit and push changes (commit 9ca354e)
- [x] Check CircleCI build status (automatically triggered by push)
- [x] Wait for publish to complete (~30 seconds after CircleCI success)
- [x] Verify JSR publication at https://jsr.io/@bodar/yadic/
- [x] Confirm JSR page shows correct exports (should be `./chain`, not `./src/chain`)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that CircleCI and JSR publication succeeded before proceeding to the next phase.

---

## Phase 2: Update totallylazy Package Structure

### Overview
Apply the same changes to totallylazy (81 files, most complex package). This package has many files across subdirectories and is imported by lazyrecords.

### Changes Required:

#### 1. Move totallylazy package.json
**Action**: Move package.json from src/ to package root

```bash
git mv packages/totallylazy/src/package.json packages/totallylazy/package.json
```

#### 2. Update totallylazy package.json
**File**: `packages/totallylazy/package.json`
**Changes**: Add exports and files fields

```json
{
  "name": "@bodar/totallylazy",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./*": "./src/*.ts"
  },
  "files": [
    "src/**/*.ts",
    "!src/**/*.test.ts"
  ]
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `./run check`
- [x] All totallylazy tests pass: `./run test packages/totallylazy/test`
- [x] All lazyrecords tests pass (to verify inter-package imports): `./run test packages/lazyrecords/test`
- [x] All tests across monorepo pass: `./run test`

---

## Phase 3: Update lazyrecords Package Structure

### Overview
Apply the same changes to lazyrecords (24 files, depends on totallylazy). This validates that inter-package dependencies continue working.

### Changes Required:

#### 1. Move lazyrecords package.json
**Action**: Move package.json from src/ to package root

```bash
git mv packages/lazyrecords/src/package.json packages/lazyrecords/package.json
```

#### 2. Update lazyrecords package.json
**File**: `packages/lazyrecords/package.json`
**Changes**: Add exports and files fields while preserving totallylazy dependency

```json
{
  "name": "@bodar/lazyrecords",
  "version": "0.0.0",
  "type": "module",
  "dependencies": {
    "@bodar/totallylazy": "workspace:totallylazy"
  },
  "devDependencies": {
    "bun-types": "1.2.3"
  },
  "exports": {
    "./*": "./src/*.ts"
  },
  "files": [
    "src/**/*.ts",
    "!src/**/*.test.ts"
  ]
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `./run check`
- [x] All lazyrecords tests pass: `./run test packages/lazyrecords/test`
- [x] All tests across monorepo pass: `./run test`

---

## Phase 4: Remove Test package.json Files

### Overview
Clean up redundant test package.json files now that test directories can import directly from package roots through workspace resolution.

### Changes Required:

#### 1. Update root workspace configuration
**File**: `package.json:4-7`
**Changes**: Remove test workspaces since they no longer have package.json files

**Current:**
```json
"workspaces": [
  "packages/*",
  "packages/**/test"
]
```

**Updated:**
```json
"workspaces": [
  "packages/*"
]
```

#### 2. Remove test package.json files
**Action**: Delete all test package.json files

```bash
rm packages/yadic/test/package.json
rm packages/totallylazy/test/package.json
rm packages/lazyrecords/test/package.json
```

### Success Criteria:

#### Automated Verification:
- [x] Workspace installation succeeds: `bun install`
- [x] TypeScript compilation passes: `./run check`
- [x] All tests across monorepo pass: `./run test`

---

## Testing Strategy

### Unit Tests:
All existing tests remain unchanged. The test suite already validates:
- Import resolution (tests import from packages)
- Package functionality (3 packages, 43 tests total)
- Inter-package dependencies (lazyrecords tests import from both lazyrecords and totallylazy)

### Integration Tests:
The JSR publish verification serves as integration testing:
- Verifies package structure is correct for publishing
- Confirms exports are properly configured
- Validates that external consumers can import from the package

### Manual Testing Steps:
1. **After Phase 1**: Check CircleCI and JSR publication for yadic
2. **After Phases 2-3**: Run full test suite to verify inter-package imports
3. **After Phase 4**: Verify workspace resolution without test package.json files

## Performance Considerations

No performance impact expected. This is purely a structural change that doesn't affect runtime behavior or build times.

## Migration Notes

### Bun Workspace Resolution
Bun will automatically resolve the new package structure through the updated workspace configuration. The `workspace:packagename` protocol in dependencies continues to work unchanged.

### Import Paths
All import paths remain unchanged:
- `@bodar/yadic/chain.ts` continues to work
- `@bodar/totallylazy/functions/Mapper.ts` continues to work
- `@bodar/lazyrecords/sql/builder/builders.ts` continues to work

The wildcard export pattern `./*` maps these imports to `./src/*.ts`.

### Rollback Plan
If issues arise, rollback is straightforward:
1. `git revert <commit-hash>` to restore previous structure
2. `bun install` to reset workspace
3. `./run test` to verify

## References

- Original ticket: `thoughts/shared/tickets/eng_3.md` → GitHub Issue #3
- Related research: `thoughts/shared/research/2025-10-24-3-standardize-package-structure.md`
- GitHub Issue: https://github.com/bodar/bodar.ts/issues/3
- Publish script: `run:58-80`
- Root workspace config: `package.json:4-7`
- Current package locations:
  - `packages/yadic/src/package.json:1-5`
  - `packages/totallylazy/src/package.json:1-5`
  - `packages/lazyrecords/src/package.json:1-11`
