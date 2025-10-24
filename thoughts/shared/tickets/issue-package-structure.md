---
date: 2025-10-24
title: "Standardize package structure: Move package.json from src/ to package root"
status: open
priority: low
tags: [refactoring, monorepo, package-structure, consistency]
---

# Standardize Package Structure

## Summary

Currently, each package in the monorepo has its `package.json` located in the `src/` directory:
- `packages/yadic/src/package.json`
- `packages/totallylazy/src/package.json`
- etc.

This is non-standard. Most packages follow the structure:
```
packages/yadic/
├── package.json          ← move here
├── src/
│   ├── chain.ts
│   ├── LazyMap.ts
│   └── types.ts
└── test/
    └── *.test.ts
```

## Benefits

1. **Standard structure** - More familiar to package consumers and tools
2. **Better control** - Easier to use `exports` and `files` fields in package.json
3. **Test exclusion** - Can explicitly exclude test files from published package using `files` field
4. **Clearer separation** - Package metadata separate from source code

## Required Changes

For each package (`yadic`, `totallylazy`, `lazyrecords`):

1. Move `src/package.json` to root of package directory
2. Update `package.json` to include:
   - `exports` field mapping imports to source files
   - `files` field to exclude test directory
3. Update publish script pattern from `packages/**/src/package.json` to `packages/*/package.json`
4. Update jsr.json generation to reference `./src/*.ts` paths

## Example package.json Changes

**Before**: `packages/yadic/src/package.json`
```json
{
  "name": "@bodar/yadic",
  "version": "0.0.0",
  "type": "module"
}
```

**After**: `packages/yadic/package.json`
```json
{
  "name": "@bodar/yadic",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./chain": "./src/chain.ts",
    "./LazyMap": "./src/LazyMap.ts",
    "./types": "./src/types.ts"
  },
  "files": [
    "src/**/*.ts",
    "!src/**/*.test.ts"
  ]
}
```

## Publish Script Changes

**Current** (`run:61`):
```typescript
const packageJsons = glob(`packages/**/src/package.json`);
```

**After**:
```typescript
const packageJsons = glob(`packages/*/package.json`);
```

**jsr.json exports** would need to adjust paths:
```typescript
// Current: assumes files are in same directory as package.json
"./types": "./types.ts"

// After: files are in src/ subdirectory
"./types": "./src/types.ts"
```

## Scope

This should be done for **all packages at once** to maintain consistency across the monorepo.

## Related Issues

- Issue #2 (JSR score improvement) - This structure change would help with proper exports but is not blocking
- No barrel files policy (documented in root README.md) - Structure supports direct imports

## Notes

- JSR uses the `exports` field in `jsr.json` to determine what gets published, so test files won't be included as long as they're not in exports
- The `files` field in `package.json` provides additional control for npm/JSR tooling
