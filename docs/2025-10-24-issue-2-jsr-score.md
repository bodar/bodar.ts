---
date: 2025-10-24T11:58:32+01:00
researcher: Daniel Worthington-Bodart
git_commit: 36780000539080a162fe45c412bd28e9d8865467
branch: master
repository: bodar.ts
topic: "JSR Score Requirements for @bodar/yadic Package"
tags: [research, codebase, yadic, jsr, documentation, scoring]
status: complete
last_updated: 2025-10-24
last_updated_by: Daniel Worthington-Bodart
---

# Research: JSR Score Requirements for @bodar/yadic Package

**Date**: 2025-10-24T11:58:32+01:00
**Researcher**: Daniel Worthington-Bodart
**Git Commit**: 36780000539080a162fe45c412bd28e9d8865467
**Branch**: master
**Repository**: bodar.ts

## Research Question

Issue #2 asks to improve the JSR score for the @bodar/yadic package from 47% to 100% by addressing missing items shown at https://jsr.io/@bodar/yadic/score. The approach should be iterative: make one commit, wait for the build, check if the score improves. Provenance (which requires GitHub Actions migration) should be left until last as it could break the feedback loop.

**Checking the Score**: Use the following command to verify the current JSR score:
```bash
curl -H 'accept: text/html' https://jsr.io/@bodar/yadic/score
```

This returns the HTML page with the current score and breakdown of missing items.

## Summary

The @bodar/yadic package is a dependency injection container with lazy initialization, published to JSR via CircleCI. The current JSR score is **47% (8/17 points)**.

**Already Complete** (8 points):
- No slow types (5/5)
- Has description via JSR settings (1/1)
- Runtime compatibility markers set (2/2)

**Missing Items** (9 points needed for 100%):
1. **README.md with code examples** (3 points) - No package-specific README exists
2. **Module documentation in all entrypoints** (1 point) - No module-level docs in chain.ts, types.ts, or LazyMap.ts
3. **JSDoc on 80%+ of exported symbols** (5 points) - Currently 0% coverage (0/11 symbols documented)

**Deferred**: Provenance (requires GitHub Actions migration per issue #2)

**Priority Order** (as specified in issue #2):
Work from top to bottom of missing items, making one commit at a time and waiting for build feedback before proceeding.

## Detailed Findings

### Package Structure

**Location**: `/home/dan/Projects/bodar.ts/packages/yadic/`

The yadic package follows a simple monorepo structure:

```
packages/yadic/
├── src/
│   ├── chain.ts (18 lines)
│   ├── LazyMap.ts (57 lines)
│   ├── types.ts (13 lines)
│   └── package.json
└── test/
    ├── chain.test.ts
    ├── LazyMap.test.ts
    └── package.json
```

**Configuration** (`packages/yadic/src/package.json:1-5`):
```json
{
  "name": "@bodar/yadic",
  "version": "0.0.0",
  "type": "module"
}
```

The package.json is minimal with no description field, which affects the JSR Discoverability score.

### JSR Scoring System - Actual Score Breakdown

**Current Score: 47% (8/17 points without provenance)**

Based on the actual JSR score page at https://jsr.io/@bodar/yadic/score:

#### Missing Items (0 points - need to fix):

1. **Has a readme or module doc** (0/2 points)
   - The package should have a README.md in the root of the repository or a module doc in the main entrypoint of the package.

2. **Has examples in the readme or module doc** (0/1 point)
   - The README or module doc of the main entrypoint should have an example of how to use the package, in the form of a code block.

3. **Has module docs in all entrypoints** (0/1 point)
   - Every entrypoint of the package should have a module doc summarizing what is defined in that module.

4. **Has docs for most symbols** (0/5 points)
   - At least 80% of the packages' exported symbols should have symbol documentation. Currently 0% of exported symbols are documented.

5. **Has provenance** (0 points - amount unspecified)
   - The package should be published from a verifiable CI/CD workflow, and have a public transparency log entry.
   - **Note**: Issue #2 specifies to leave this until last as it requires GitHub Actions migration which could break the feedback loop.

#### Complete Items (8 points):

1. **No slow types are used** (5/5 points) ✓
   - The package should not use slow types.

2. **Has a description** (1/1 point) ✓
   - The package should have a description set in the package settings to help users find this package via search.
   - **Note**: This must be set via JSR package settings, not in package.json.

3. **At least one runtime is marked as compatible** (1/1 point) ✓
   - The package should be marked with at least one runtime as "compatible" in the package settings.

4. **At least two runtimes are marked as compatible** (1/1 point) ✓
   - The package should be compatible with more than one runtime.

**Path to 100%**: To reach 100% score (without provenance), need to gain 9 points:
- Add README.md with examples: +3 points (2+1)
- Add module docs to all entrypoints: +1 point
- Add JSDoc to 80%+ of exported symbols: +5 points
- **Total**: 8 + 9 = 17 points

### TypeScript Types Coverage

The sub-agent analysis revealed comprehensive TypeScript type coverage:

**Type Definitions** (5 total):
- `Overwrite<T, U>` - Type utility for property merging (`chain.ts:1`)
- `Chain<T>` - Recursive type for object chaining (`chain.ts:2-4`)
- `Dependency<K, V>` - Mapped readonly type (`types.ts:1-3`)
- `AutoConstructor<D, T>` - Constructor with dependencies interface (`types.ts:5-7`)
- `Constructor<T>` - Zero-arg constructor interface (`types.ts:9-11`)

**Exported Modules** (11 total):
- `chain()` function with full type signature (`chain.ts:6-18`)
- `LazyMap` class with generic methods (`LazyMap.ts:4-36`)
- `isConstructor()`, `alias()`, `instance()`, `constructor()` utility functions (`LazyMap.ts:38-57`)

**Type Annotation Coverage**:
- Function signatures: 100% (all have parameter types)
- Return types: 60% (6 of 10 functions have explicit return types)
- Class fields: 100% (1 of 1 has explicit type)

### JSDoc Documentation Coverage

**Current State**: **0% JSDoc coverage** across all three source files

**Missing Documentation**:

`chain.ts` (no JSDoc on any export):
- Type `Overwrite` - No documentation
- Type `Chain` - No documentation
- Function `chain` - No documentation

`types.ts` (no JSDoc on any export):
- Type `Dependency` - No documentation
- Interface `AutoConstructor` - No documentation
- Interface `Constructor` - No documentation

`LazyMap.ts` (no JSDoc on any export):
- Class `LazyMap` - No documentation
- Method `create` - No documentation
- Method `set` - No documentation
- Method `decorate` - No documentation
- Function `isConstructor` - No documentation
- Function `alias` - No documentation
- Function `instance` - No documentation
- Function `constructor` - No documentation

This represents **11 exported symbols** without any JSDoc documentation, which directly impacts the JSR Documentation score.

### Build and Publishing Configuration

**CI/CD**: CircleCI configuration exists at `.circleci/config.yml:1-15`

The build runs via `./run ci` which executes:
1. `build()` - Clean, typecheck, test (`run:46-50`)
2. `publish()` - Generate jsr.json dynamically and publish (`run:58-79`)

**JSR Publishing Process** (`run:58-79`):
The `publish()` function dynamically generates `jsr.json` files by:
- Finding all `packages/**/src/package.json` files
- Looking for `types.ts` files in the package
- Creating exports mapping: `{"./types": "./types.ts"}`
- Adding name, version, and Apache-2.0 license
- Publishing with `bunx jsr publish --allow-dirty`
- Cleaning up jsr.json files after publish

**Current Export Pattern - Temporary Workaround**:
The publish script at `run:65-74` currently filters to only export files matching `**/types.ts`. This is a temporary workaround to prevent the build from attempting to publish the `lazyrecords` package, which has unresolved dependencies on `totallylazy`.

**Planned Change**: Instead of filtering by `types.ts`, the publish function should be updated to explicitly target only the `totallylazy` and `yadic` packages, excluding `lazyrecords` entirely until its dependency issues are resolved.

**Current Impact on yadic**:
The current JSR package only exposes:
- `@bodar/yadic/types` → `types.ts`

But does NOT expose:
- `chain.ts` (not named types.ts)
- `LazyMap.ts` (not named types.ts)

This means the main functionality (LazyMap class, chain function) may not be currently accessible via the published JSR package.

### Missing README

**Finding**: No README.md exists in `packages/yadic/` directory

The monorepo has a root README.md mentioning yadic, but JSR's Documentation score looks for package-specific README files. Without a package-level README, the Documentation score is negatively impacted.

### TypeScript Configuration

**Root tsconfig.json** (`tsconfig.json:1-33`):
- Strict mode enabled
- Target: ESNext
- Module: ESNext with bundler resolution
- No emit (type checking only)
- Experimental decorators enabled

The TypeScript configuration is appropriate for JSR publishing with strict type checking enabled.

## Architecture Documentation

### Dependency Injection Pattern

The yadic package implements a type-safe dependency injection container using:

**Builder Pattern**: `LazyMap` class provides fluent API via method chaining
- Each method returns `this & Dependency<K, V>` to progressively add types
- Type system tracks all registered dependencies

**Lazy Initialization**: Dependencies are computed on first access via property getters defined using `Object.defineProperty` (`LazyMap.ts:17-24`)

**Factory Functions**: Dependencies are defined as functions receiving dependencies:
- `set(key, factory)` - Factory receives all deps except the one being defined
- `decorate(key, decorator)` - Decorator receives all deps including the one being decorated
- Helper functions: `instance()`, `alias()`, `constructor()` wrap values as factories

**Type Merging**: `chain()` function merges multiple objects with right-to-left precedence using recursive conditional types (`chain.ts:2-4`)

## Code References

- `packages/yadic/src/package.json:1-5` - Package configuration
- `packages/yadic/src/chain.ts:1-18` - Chain utility implementation
- `packages/yadic/src/types.ts:1-11` - Type definitions
- `packages/yadic/src/LazyMap.ts:4-57` - Main LazyMap class and utilities
- `.circleci/config.yml:1-15` - CI configuration
- `run:58-79` - JSR publishing logic
- `tsconfig.json:1-33` - TypeScript configuration

## Implementation Notes

**Export Configuration Resolution**:
The `types.ts` filter in the publish script (`run:65-74`) was a temporary workaround to prevent publishing `lazyrecords` which has unresolved dependencies on `totallylazy`. The solution is to update the publish function to explicitly target only `totallylazy` and `yadic` packages, ignoring `lazyrecords`. This will allow all source files (chain.ts, LazyMap.ts, types.ts) to be properly exported for the yadic package.

**README Location**:
The README.md should be placed in `packages/yadic/src/` to align with the package structure where the package.json is located. This will ensure JSR can find it as part of the published package. The README with code examples should satisfy both:
- "Has a readme or module doc" (2 points)
- "Has examples in the readme or module doc" (1 point)

This provides 3 of the 9 missing points.

**Module Documentation**:
Module-level JSDoc comments should still be added at the top of each entrypoint file (chain.ts, types.ts, LazyMap.ts) to satisfy "Has module docs in all entrypoints" (1 point). The README serves as package-level documentation, while module docs provide file-level summaries of what each module exports.

## Related Research

None - this is the initial research document for issue #2.
