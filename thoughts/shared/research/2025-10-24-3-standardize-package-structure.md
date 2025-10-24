---
date: 2025-10-24T17:25:20+01:00
researcher: Daniel Worthington-Bodart
git_commit: 260dab3d7a9b8b29a5209d20b491baf7b043f976
branch: master
repository: bodar.ts
topic: "Standardize package structure: Move package.json from src/ to package root"
tags: [research, codebase, monorepo, package-structure, refactoring]
status: complete
last_updated: 2025-10-24
last_updated_by: Daniel Worthington-Bodart
---

# Research: Standardize Package Structure

**Date**: 2025-10-24T17:25:20+01:00
**Researcher**: Daniel Worthington-Bodart
**Git Commit**: 260dab3d7a9b8b29a5209d20b491baf7b043f976
**Branch**: master
**Repository**: bodar.ts

## Research Question

How do we standardize the package structure across all 3 packages (yadic, totallylazy, lazyrecords) by moving package.json from src/ to the package root, while ensuring workspace imports, inter-package dependencies, and the publish script continue to work?

## Summary

The monorepo currently has a non-standard structure with package.json files located in src/ directories rather than at package roots. The codebase consists of three packages (yadic, totallylazy, lazyrecords) with the following characteristics:

- Package.json files are located in `packages/*/src/` subdirectories
- Test directories have their own package.json files with workspace references
- The root workspace configuration points to `packages/**/src` and `packages/**/test`
- Inter-package dependencies use nested import paths (e.g., `@bodar/totallylazy/functions/Mapper.ts`)
- The publish script searches for package.json in src/ directories and generates exports dynamically

## Detailed Findings

### Current Package Structure

**Three packages exist:**
- yadic (3 TypeScript files)
- totallylazy (81 TypeScript files across multiple subdirectories)
- lazyrecords (24 TypeScript files in nested sql/ structure)

**Current package.json locations:**
- `/home/dan/Projects/bodar.ts/packages/yadic/src/package.json`
- `/home/dan/Projects/bodar.ts/packages/totallylazy/src/package.json`
- `/home/dan/Projects/bodar.ts/packages/lazyrecords/src/package.json`

**Current test package.json files (to be removed):**
- `/home/dan/Projects/bodar.ts/packages/yadic/test/package.json`
- `/home/dan/Projects/bodar.ts/packages/totallylazy/test/package.json`
- `/home/dan/Projects/bodar.ts/packages/lazyrecords/test/package.json`

**Example current package.json content** (yadic/src/package.json:1-5):
```json
{
  "name": "@bodar/yadic",
  "version": "0.0.0",
  "type": "module"
}
```

### Workspace Configuration

**Current configuration** (package.json:4-6):
```json
"workspaces": [
  "packages/**/src",
  "packages/**/test"
]
```

This configuration tells Bun to look for workspace packages in:
- `packages/**/src` directories (where the package.json files currently reside)
- `packages/**/test` directories (which contain test-specific package.json files with workspace references)

### Inter-Package Dependencies

**Key finding:** lazyrecords extensively imports from totallylazy using nested paths:

```typescript
import {Mapper} from "@bodar/totallylazy/functions/Mapper.ts";
import {Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";
import {Predicate} from "@bodar/totallylazy/predicates/Predicate.ts";
```

**Examples from lazyrecords/src/sql/builder/builders.ts:5-21:**
- `@bodar/totallylazy/functions/Mapper.ts`
- `@bodar/totallylazy/transducers/Transducer.ts`
- `@bodar/totallylazy/transducers/FilterTransducer.ts`
- `@bodar/totallylazy/transducers/MapTransducer.ts`
- `@bodar/totallylazy/predicates/WherePredicate.ts`
- `@bodar/totallylazy/predicates/IsPredicate.ts`
- `@bodar/totallylazy/predicates/AndPredicate.ts`
- `@bodar/totallylazy/predicates/OrPredicate.ts`

These imports directly reference TypeScript files with .ts extensions, requiring the package to support subpath imports. Currently, these imports work because the workspace packages are resolved from the src/ directories.

### Publish Script

**Current implementation** (run:58-80):
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

Key characteristics of the current implementation:
- Searches for package.json in `packages/yadic/src/` directory
- Generates a jsr.json file dynamically for JSR publishing
- Scans for TypeScript files within the package directory
- Builds an exports map by finding all .ts files and mapping them to export paths
- Only publishes the yadic package (hardcoded path)

### Test Package Dependencies

**Test package.json files use workspace references:**

Example from yadic/test/package.json:1-11:
```json
{
  "name": "@bodar/yadic-test",
  "version": "0.0.0",
  "type": "module",
  "dependencies": {
    "@bodar/yadic": "workspace:yadic"
  },
  "devDependencies": {
    "bun-types": "1.2.3"
  }
}
```

These test package.json files allow tests to import from their parent packages using workspace protocol references (`workspace:yadic`). All three packages follow this pattern for their test directories.


## Code References

- Root workspace config: `package.json:4-6`
- Yadic package.json: `packages/yadic/src/package.json:1-5`
- Totallylazy package.json: `packages/totallylazy/src/package.json`
- Lazyrecords package.json: `packages/lazyrecords/src/package.json`
- Lazyrecords imports from totallylazy: `packages/lazyrecords/src/sql/builder/builders.ts:5-21`
- Test package.json example: `packages/yadic/test/package.json:1-11`
- Publish script: `run:58-80`
- Publish glob pattern: `run:62`
- JSR exports generation: `run:70-72`

## Architecture Documentation

**Current monorepo structure:**
```
bodar.ts/
├── package.json (workspace root)
└── packages/
    ├── yadic/
    │   ├── src/
    │   │   ├── package.json ← current location
    │   │   ├── chain.ts
    │   │   ├── LazyMap.ts
    │   │   └── types.ts
    │   └── test/
    │       ├── package.json ← to be removed
    │       └── *.test.ts
    ├── totallylazy/ (similar structure, 81 files)
    └── lazyrecords/ (similar structure, 24 files)
```

**Target structure:**
```
bodar.ts/
├── package.json (workspace root, updated)
└── packages/
    ├── yadic/
    │   ├── package.json ← new location, with exports
    │   ├── src/
    │   │   ├── chain.ts
    │   │   ├── LazyMap.ts
    │   │   └── types.ts
    │   └── test/
    │       └── *.test.ts (no package.json)
    ├── totallylazy/ (similar structure)
    └── lazyrecords/ (similar structure)
```

## Related Research

Related to GitHub Issue #3: https://github.com/bodar/bodar.ts/issues/3

## Resolved Questions

1. **Why was the non-standard structure (package.json in src/) originally chosen?**
   - The `exports` and `files` fields that can solve this problem did not exist when the project started (Node.js introduced these features later)
   - The src/ structure was a workaround before these package.json features were available

2. **How does Bun currently resolve the nested import paths like `@bodar/totallylazy/functions/Mapper.ts`?**
   - Bun's workspace resolution handles this automatically through the `workspace:` protocol defined in package.json
   - The workspace configuration pointing to `packages/**/src` enables Bun to resolve these paths correctly

3. **Why does the publish script only handle the yadic package?**
   - There are multiple issues that need fixing before totallylazy and lazyrecords can be published to JSR (slow types, documentation, etc.)
   - Tracked in GitHub Issue #4: https://github.com/bodar/bodar.ts/issues/4
