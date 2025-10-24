---
date: 2025-10-24
title: "JSR Score Improvement for @bodar/yadic Package"
status: draft
priority: high
tags: [jsr, documentation, yadic, quality]
related_research: thoughts/shared/research/2025-10-24-issue-2-jsr-score.md
related_tickets: thoughts/shared/tickets/issue-package-structure.md
---

# JSR Score Improvement for @bodar/yadic Package

## Overview

Improve the JSR score for the @bodar/yadic package from 47% (8/17 points) to 100% (17/17 points) by fixing export configuration and adding comprehensive documentation. This will be done iteratively: make one commit, wait for the build, check if the score improves. Provenance is explicitly excluded as it requires GitHub Actions migration.

## Current State Analysis

**Current JSR Score**: 47% (8/17 points)

**Already Complete** (8 points):
- No slow types (5/5 points)
- Has description via JSR settings (1/1 point)
- At least one runtime marked compatible (1/1 point)
- At least two runtimes marked compatible (1/1 point)

**Missing Items** (9 points):
- Has a readme or module doc (0/2 points)
- Has examples in readme or module doc (0/1 point)
- Has module docs in all entrypoints (0/1 point)
- Has docs for most symbols (0/5 points) - Currently 0% (0/11 symbols documented)

**Critical Issue Found**:
- The publish script at `run:65` only exports files matching `**/types.ts`
- This means `chain.ts` and `LazyMap.ts` are NOT accessible via JSR
- Only `@bodar/yadic/types` is currently exported

### Key Discoveries:
- Package location: `packages/yadic/src/` (`packages/yadic/src/package.json:1-5`)
- Three source files with 11 exported symbols total:
  - `chain.ts` - 3 exports: `Overwrite`, `Chain`, `chain()` (`chain.ts:1-18`)
  - `LazyMap.ts` - 5 exports: `LazyMap`, `isConstructor()`, `alias()`, `instance()`, `constructor()` (`LazyMap.ts:4-57`)
  - `types.ts` - 3 exports: `Dependency`, `AutoConstructor`, `Constructor` (`types.ts:1-11`)
- Test files contain excellent usage examples (`packages/yadic/test/LazyMap.test.ts`, `packages/yadic/test/chain.test.ts`)
- No existing documentation or comments in source files

## Desired End State

**Target JSR Score**: 100% (17/17 points without provenance)

**Verification**:
1. All three source files are exported and accessible via JSR imports:
   - `import { chain } from "@bodar/yadic/chain"`
   - `import { LazyMap } from "@bodar/yadic/LazyMap"`
   - `import type { Dependency } from "@bodar/yadic/types"`

2. JSR score page shows all missing items completed:
   - Check with: `curl -H 'accept: text/html' https://jsr.io/@bodar/yadic/score`
   - Verify 17/17 points achieved

3. All 11 exported symbols have JSDoc documentation (100% coverage)

4. Package-specific README exists with code examples

5. All three entrypoint files have module-level documentation

## What We're NOT Doing

- **Not changing package structure** - Keeping `package.json` in `src/` for now (tracked in separate ticket)
- **Not adding barrel files** - Project policy is to import directly from source files
- **Not implementing provenance** - Requires GitHub Actions migration which could break feedback loop
- **Not refactoring code** - Only adding documentation
- **Not modifying tests** - Tests are already comprehensive
- **Not changing API** - Public interface remains unchanged

## Implementation Approach

Work iteratively through each phase, **committing one file at a time** as documentation is added. After each commit:
1. Wait for CircleCI build to complete
2. Check JSR score with curl command
3. Verify score increased (if applicable)
4. Only proceed to next file after confirmation

Use test files as source of truth for documentation examples since they demonstrate actual usage patterns.

**Commit Strategy**:
- Phase 1: One commit for publish script
- Phase 2: One commit for README
- Phase 3-5: One commit per source file (module doc + all symbol docs for that file)

---

## Phase 1: Fix Export Configuration

### Overview
Update the publish script to export all TypeScript files in the src directory, not just files named `types.ts`. This ensures the main functionality (LazyMap class, chain function) is accessible via JSR.

### Changes Required

#### 1. Publish Script Export Pattern
**File**: `run`
**Changes**: Update the TypeScript file glob pattern to include all `.ts` files

**Current** (`run:65`):
```typescript
const typescript = await toPromiseArray(new Glob(`./**/types.ts`).scan(parent));
```

**After**:
```typescript
const typescript = await toPromiseArray(new Glob(`./**/*.ts`).scan(parent));
```

**Explanation**:
- Changes pattern from `./**/types.ts` (only files named types.ts) to `./**/*.ts` (all .ts files)
- Will now find: `chain.ts`, `LazyMap.ts`, `types.ts`
- Test files in `test/` directory are not under `src/`, so they won't be included

#### 2. Verify Export Mapping
The existing export mapping logic at `run:69-71` will automatically handle all files:
```typescript
exports: typescript.reduce((a, ts) => {
  a[ts.replace(/\.ts$/, '')] = ts;
  return a;
}, {} as Record<string, string>)
```

This will generate `jsr.json` with:
```json
{
  "exports": {
    "./chain": "./chain.ts",
    "./LazyMap": "./LazyMap.ts",
    "./types": "./types.ts"
  }
}
```

### Success Criteria

#### Automated Verification:
- [x] Build passes: `./run check`
- [x] Tests pass: `./run test`
- [x] Pushed to origin (commit 292303d)
- [ ] Publish succeeds in CI (CircleCI build completes)

#### Manual Verification:
- [ ] Verify jsr.json would be generated correctly by examining publish script logic
- [ ] After CI publish, check JSR package page shows all three exports
- [ ] Score should remain at 47% (this phase doesn't add documentation)

**Implementation Note**: This phase fixes the technical issue but doesn't improve the score yet. It's a prerequisite for users to access the documented functionality in later phases.

---

## Phase 2: Add README with Examples

### Overview
Create a package-specific README with comprehensive usage examples. This satisfies both "Has a readme or module doc" (2 points) and "Has examples in readme or module doc" (1 point).

### Changes Required

#### 1. Package README
**File**: `packages/yadic/src/README.md` (new file)
**Changes**: Create comprehensive README with examples

```markdown
# @bodar/yadic

A super small and lightning fast dependency injection container with lazy initialization. Uses lazy properties that once called are automatically converted into regular read-only properties for ultimate speed and reliability in constructing graphs of objects.

## Installation

```bash
# Deno
import { LazyMap } from "jsr:@bodar/yadic/LazyMap";

# Node.js
npx jsr add @bodar/yadic
import { LazyMap } from "@bodar/yadic/LazyMap";

# Bun
bunx jsr add @bodar/yadic
import { LazyMap } from "@bodar/yadic/LazyMap";
```

## Quick Start

```typescript
import { LazyMap, instance, constructor } from "@bodar/yadic/LazyMap";

// Create a dependency container
const container = LazyMap.create()
  .set('apiUrl', instance('https://api.example.com'))
  .set('timeout', instance(5000))
  .set('client', constructor(HttpClient));

// Dependencies are initialized lazily on first access
const client = container.client; // HttpClient is instantiated here
```

## Core Features

### Lazy Initialization

Dependencies are only computed on first access and then cached:

```typescript
import { LazyMap } from "@bodar/yadic/LazyMap";

let callCount = 0;
const map = LazyMap.create()
  .set('value', () => {
    callCount++;
    return 'expensive computation';
  });

console.log(callCount); // 0 - not called yet
console.log(map.value); // 'expensive computation'
console.log(callCount); // 1 - called once
console.log(map.value); // 'expensive computation' (cached)
console.log(callCount); // 1 - still only called once
```

### Type-Safe Dependencies

The container tracks all registered dependencies in the type system:

```typescript
import { LazyMap, instance } from "@bodar/yadic/LazyMap";

const map = LazyMap.create()
  .set('port', instance(8080))
  .set('host', instance('localhost'))
  .set('url', (deps) => `http://${deps.host}:${deps.port}`);

// TypeScript knows about all dependencies
const url: string = map.url; // Type-safe access
```

### Constructor Injection

Automatically inject dependencies into class constructors:

```typescript
import { LazyMap, constructor, instance } from "@bodar/yadic/LazyMap";
import type { Dependency } from "@bodar/yadic/types";

class Database {
  constructor(deps: Dependency<'connectionString', string>) {
    this.connect(deps.connectionString);
  }
}

const container = LazyMap.create()
  .set('connectionString', instance('postgres://localhost'))
  .set('db', constructor(Database));

const db = container.db; // Database instance with injected connection string
```

### Helper Functions

#### instance()
Wraps a constant value as a dependency:

```typescript
import { LazyMap, instance } from "@bodar/yadic/LazyMap";

const map = LazyMap.create()
  .set('config', instance({ debug: true, port: 3000 }));
```

#### alias()
Creates an alias to another dependency:

```typescript
import { LazyMap, instance, alias } from "@bodar/yadic/LazyMap";

const map = LazyMap.create()
  .set('primaryDb', instance(new Database()))
  .set('db', alias('primaryDb')); // db points to primaryDb
```

#### constructor()
Wraps a constructor function for automatic instantiation:

```typescript
import { LazyMap, constructor } from "@bodar/yadic/LazyMap";

class Service {}

const map = LazyMap.create()
  .set('service', constructor(Service));
```

### Decoration Pattern

Wrap existing dependencies with additional functionality:

```typescript
import { LazyMap, constructor } from "@bodar/yadic/LazyMap";

class Logger {
  log(msg: string) { console.log(msg); }
}

class TimestampLogger {
  constructor(deps: Dependency<'logger', Logger>) {
    this.logger = deps.logger;
  }
  log(msg: string) {
    this.logger.log(`[${new Date().toISOString()}] ${msg}`);
  }
}

const map = LazyMap.create()
  .set('logger', constructor(Logger))
  .decorate('logger', constructor(TimestampLogger));

map.logger.log('Hello'); // Outputs with timestamp
```

### Parent-Child Containers

Create child containers that inherit from parent:

```typescript
import { LazyMap, instance } from "@bodar/yadic/LazyMap";

const parent = LazyMap.create()
  .set('apiUrl', instance('https://api.example.com'));

const child = LazyMap.create(parent)
  .set('endpoint', (deps) => `${deps.apiUrl}/users`);

console.log(child.endpoint); // 'https://api.example.com/users'
```

### Object Chaining

Merge multiple objects with precedence (earlier objects override later ones):

```typescript
import { chain } from "@bodar/yadic/chain";

const defaults = { timeout: 5000, retries: 3 };
const overrides = { timeout: 10000 };

const config = chain(overrides, defaults);
console.log(config.timeout); // 10000 (from overrides)
console.log(config.retries); // 3 (from defaults)
```

## API Reference

See the [JSR documentation](https://jsr.io/@bodar/yadic) for complete API details.

## License

Apache-2.0
```

### Success Criteria

#### Automated Verification:
- [ ] File exists: `test -f packages/yadic/src/README.md`
- [ ] Build passes: `./run check`
- [ ] Tests pass: `./run test`
- [ ] Publish succeeds in CI

#### Manual Verification:
- [ ] JSR score increases from 47% to 65% (+3 points: 2 for README + 1 for examples)
- [ ] Verify with: `curl -H 'accept: text/html' https://jsr.io/@bodar/yadic/score | grep -o '[0-9]*%'`
- [ ] README renders correctly on JSR package page
- [ ] Code examples are accurate and executable

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the score increased to 65% before proceeding to Phase 3.

---

## Phase 3: Add Documentation to chain.ts

### Overview
Add module-level JSDoc and all symbol documentation to chain.ts in a single commit. This file has 3 exported symbols that need documentation.

### Changes Required

#### 1. Module Documentation
**File**: `packages/yadic/src/chain.ts`
**Changes**: Add JSDoc at the beginning of the file

Add before line 1:
```typescript
/**
 * Object chaining utilities for merging multiple objects with precedence.
 *
 * The chain function and types enable merging objects where earlier objects
 * take precedence over later ones. Implemented using ES6 Proxy for efficient
 * runtime property lookup.
 *
 * @module
 *
 * @example
 * ```ts
 * import { chain } from "@bodar/yadic/chain";
 *
 * const defaults = { timeout: 5000, retries: 3 };
 * const overrides = { timeout: 10000 };
 *
 * const config = chain(overrides, defaults);
 * console.log(config.timeout); // 10000 (from overrides)
 * console.log(config.retries); // 3 (from defaults)
 * ```
 */

```

#### 2. Symbol Documentation

Add JSDoc to all 3 exported symbols in chain.ts:

**Symbol 1: Overwrite type** (before line 1):
```typescript
/**
 * Type utility that overwrites properties from T with properties from U.
 *
 * Removes keys from T that exist in U, then intersects with U to create
 * a new type where U's properties take precedence.
 *
 * @template T - The base type
 * @template U - The overriding type
 *
 * @example
 * ```ts
 * type Base = { a: number; b: string };
 * type Override = { a: string };
 * type Result = Overwrite<Base, Override>;
 * // Result is { b: string; a: string }
 * ```
 */
export type Overwrite<T, U> = ...
```

**Symbol 2: Chain type** (before line 2):
```typescript
/**
 * Recursively merges a tuple of types with earlier types taking precedence.
 *
 * Processes an array of types from left to right, where properties in earlier
 * types override properties in later types. The result is a single merged type.
 *
 * @template T - Tuple array of types to merge
 *
 * @example
 * ```ts
 * type Config = Chain<[{ timeout: number }, { timeout: string; retries: number }]>;
 * // Config is { timeout: number; retries: number }
 * ```
 */
export type Chain<T extends unknown[]> = ...
```

**Symbol 3: chain function** (before line 6):
```typescript
/**
 * Chains multiple objects together with earlier objects taking precedence.
 *
 * Creates a Proxy that searches through objects in order, returning the first
 * found property. Properties from objects earlier in the array override those
 * in later objects. Useful for configuration merging and defaults.
 *
 * @template T - Tuple array of object types to chain
 * @param objects - Objects to chain, with earlier objects having higher precedence
 * @returns A proxy that combines all objects with proper precedence
 *
 * @example
 * ```ts
 * const defaults = { timeout: 5000, retries: 3 };
 * const overrides = { timeout: 10000 };
 * const config = chain(overrides, defaults);
 * console.log(config.timeout); // 10000
 * console.log(config.retries); // 3
 * ```
 */
export function chain<T extends unknown[]>(...objects: T): Chain<T> {
```

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compilation succeeds: `./run check`
- [ ] Tests pass: `./run test`
- [ ] All JSDoc comments are valid
- [ ] Publish succeeds in CI

#### Manual Verification:
- [ ] JSR score may increase (partial credit for module docs and symbols)
- [ ] Verify with: `curl -H 'accept: text/html' https://jsr.io/@bodar/yadic/score | grep -o '[0-9]*%'`
- [ ] chain.ts shows module documentation on JSR package page
- [ ] All 3 symbols in chain.ts show documentation on JSR

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the JSR build completed successfully before proceeding to Phase 4.

---

## Phase 4: Add Documentation to LazyMap.ts

### Overview
Add module-level JSDoc and all symbol documentation to LazyMap.ts in a single commit. This file has 5 exported symbols (including class methods) that need documentation.

### Changes Required

#### 1. Module Documentation
**File**: `packages/yadic/src/LazyMap.ts`
**Changes**: Add JSDoc at the beginning of the file

Add before line 1:
```typescript
/**
 * Lazy dependency injection container with type-safe dependency tracking.
 *
 * LazyMap provides a builder pattern for defining dependencies that are only
 * initialized on first access. Once accessed, dependencies are automatically
 * cached as immutable properties for optimal performance.
 *
 * Supports constructor injection, decoration pattern, parent-child containers,
 * and full TypeScript type inference for all registered dependencies.
 *
 * @module
 *
 * @example
 * ```ts
 * import { LazyMap, instance, constructor } from "@bodar/yadic/LazyMap";
 *
 * class Database {
 *   constructor(deps: Dependency<'url', string>) {
 *     this.connect(deps.url);
 *   }
 * }
 *
 * const container = LazyMap.create()
 *   .set('url', instance('postgres://localhost'))
 *   .set('db', constructor(Database));
 *
 * const db = container.db; // Initialized on first access
 * ```
 */

```

#### 2. Symbol Documentation
**File**: `packages/yadic/src/LazyMap.ts`
**Changes**: Add JSDoc to 5 exported symbols

**Symbol 1: LazyMap class** (before line 4):
```typescript
/**
 * A lazy dependency injection container with type-safe dependency tracking.
 *
 * LazyMap uses a builder pattern to define dependencies as factory functions.
 * Dependencies are only computed on first access via property getters, then
 * automatically cached as immutable properties for optimal performance.
 *
 * Supports parent-child containers, decoration pattern, and full TypeScript
 * type inference for all registered dependencies.
 *
 * @template P - Parent container type (if any)
 *
 * @example
 * ```ts
 * const container = LazyMap.create()
 *   .set('port', instance(8080))
 *   .set('url', (deps) => `http://localhost:${deps.port}`);
 *
 * console.log(container.url); // 'http://localhost:8080'
 * ```
 */
export class LazyMap<P = unknown> {
```

**For class methods, add JSDoc before each method:**

**create method** (before line 11):
```typescript
  /**
   * Creates a new LazyMap instance, optionally inheriting from a parent container.
   *
   * When a parent is provided, the child container can access all parent
   * dependencies through the chaining mechanism.
   *
   * @template P - Parent container type
   * @param parent - Optional parent container to inherit from
   * @returns New LazyMap instance with access to parent dependencies
   *
   * @example
   * ```ts
   * const parent = LazyMap.create()
   *   .set('apiUrl', instance('https://api.example.com'));
   *
   * const child = LazyMap.create(parent)
   *   .set('endpoint', (deps) => `${deps.apiUrl}/users`);
   * ```
   */
  static create<P>(parent?: P): LazyMap & P {
```

**set method** (before line 15):
```typescript
  /**
   * Registers a dependency with a factory function for lazy initialization.
   *
   * The factory receives all current dependencies except the one being defined.
   * On first access, the factory is called and the result is cached as an
   * immutable property. Once accessed, the property cannot be redefined.
   *
   * @template K - Property key type
   * @template V - Property value type
   * @param key - The dependency key
   * @param factory - Function that receives dependencies and returns the value
   * @returns This container with the new dependency added to its type
   *
   * @example
   * ```ts
   * const map = LazyMap.create()
   *   .set('port', () => 8080)
   *   .set('url', (deps) => `http://localhost:${deps.port}`);
   * ```
   */
  set<K extends string, V>(
```

**decorate method** (before line 28):
```typescript
  /**
   * Wraps an existing dependency with additional functionality.
   *
   * Removes the original dependency, then re-registers it with a decorator
   * function that receives both the original value and all dependencies.
   * Useful for adding cross-cutting concerns like logging or caching.
   *
   * @template K - Property key type
   * @template V - Property value type
   * @param key - The dependency key to decorate
   * @param factory - Function that receives original value plus all dependencies
   * @returns This container with the decorated dependency
   * @throws {Error} If the key doesn't exist in the container
   *
   * @example
   * ```ts
   * const map = LazyMap.create()
   *   .set('logger', constructor(Logger))
   *   .decorate('logger', constructor(TimestampLogger));
   * ```
   */
  decorate<K extends keyof this, V>(
```

**Symbol 2: isConstructor function** (before line 38):
```typescript
/**
 * Checks if a function is a constructor (has a prototype).
 *
 * Tests whether a function is a class constructor or a regular function
 * by checking for the presence of a prototype property that references
 * the function itself.
 *
 * @param fn - Function to test
 * @returns True if fn is a constructor, false otherwise
 *
 * @example
 * ```ts
 * class MyClass {}
 * function myFunc() {}
 *
 * console.log(isConstructor(MyClass)); // true
 * console.log(isConstructor(myFunc)); // false
 * ```
 */
export function isConstructor(fn: Function): boolean {
```

**Symbol 3: alias function** (before line 42):
```typescript
/**
 * Creates a dependency factory that aliases another dependency.
 *
 * Returns a factory function that extracts a specific property from the
 * dependencies object. Useful for creating shorter names or references
 * to existing dependencies.
 *
 * @template K - Property key type
 * @param key - The dependency key to alias
 * @returns Factory function that returns the aliased dependency value
 *
 * @example
 * ```ts
 * const map = LazyMap.create()
 *   .set('primaryDatabase', instance(new Database()))
 *   .set('db', alias('primaryDatabase'));
 * ```
 */
export function alias<K extends string>(key: K) {
```

**Symbol 4: instance function** (before line 46):
```typescript
/**
 * Wraps a constant value as a dependency factory.
 *
 * Creates a zero-argument factory function that returns the provided value.
 * Use this helper to register constant values or pre-constructed objects
 * as dependencies.
 *
 * @template T - Value type
 * @param value - The constant value to wrap
 * @returns Factory function that returns the value
 *
 * @example
 * ```ts
 * const map = LazyMap.create()
 *   .set('config', instance({ debug: true, port: 3000 }))
 *   .set('version', instance('1.0.0'));
 * ```
 */
export function instance<T>(value: T) {
```

**Symbol 5: constructor function** (before line 50):
```typescript
/**
 * Creates a dependency factory for automatic constructor invocation.
 *
 * Wraps a class constructor to be invoked automatically when the dependency
 * is accessed. Supports constructors with 0 arguments or 1 argument (dependencies).
 *
 * @template D - Dependencies type
 * @template T - Instance type
 * @param valueConstructor - Constructor function to wrap
 * @returns Factory function that instantiates the class
 * @throws {Error} If constructor has an unsupported number of parameters
 *
 * @example
 * ```ts
 * class Service {
 *   constructor(deps: Dependency<'config', Config>) {
 *     this.config = deps.config;
 *   }
 * }
 *
 * const map = LazyMap.create()
 *   .set('config', instance(new Config()))
 *   .set('service', constructor(Service));
 * ```
 */
export function constructor<D, T>(
```

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compilation succeeds: `./run check`
- [ ] Tests pass: `./run test`
- [ ] All JSDoc comments are valid
- [ ] Publish succeeds in CI

#### Manual Verification:
- [ ] JSR score may increase further
- [ ] Verify with: `curl -H 'accept: text/html' https://jsr.io/@bodar/yadic/score | grep -o '[0-9]*%'`
- [ ] LazyMap.ts shows module documentation on JSR package page
- [ ] All 5 symbols in LazyMap.ts show documentation on JSR

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the JSR build completed successfully before proceeding to Phase 5.

---

## Phase 5: Add Documentation to types.ts

### Overview
Add module-level JSDoc and all symbol documentation to types.ts in a single commit. This file has 3 exported type definitions that need documentation. This is the final documentation phase.

### Changes Required

#### 1. Module Documentation
**File**: `packages/yadic/src/types.ts`
**Changes**: Add JSDoc at the beginning of the file

Add before line 1:
```typescript
/**
 * TypeScript type definitions for the yadic dependency injection system.
 *
 * Provides type-safe interfaces and utilities for defining dependencies,
 * constructors, and dependency-aware classes.
 *
 * @module
 *
 * @example
 * ```ts
 * import type { Dependency, AutoConstructor } from "@bodar/yadic/types";
 *
 * // Define a dependency
 * type DbDep = Dependency<'connectionString', string>;
 *
 * // Use in a constructor
 * class Database {
 *   constructor(deps: DbDep) {
 *     this.connect(deps.connectionString);
 *   }
 * }
 * ```
 */

```

#### 2. Symbol Documentation
**File**: `packages/yadic/src/types.ts`
**Changes**: Add JSDoc to 3 exported symbols

**Symbol 1: Dependency type** (before line 1):
```typescript
/**
 * Represents a readonly dependency with a specific key and value type.
 *
 * Creates a mapped type with a single readonly property. Used to define
 * the shape of dependencies that classes can require in their constructors.
 *
 * @template K - Property key (dependency name)
 * @template V - Property value type
 *
 * @example
 * ```ts
 * type DbDependency = Dependency<'connectionString', string>;
 * // Equivalent to: { readonly connectionString: string }
 *
 * class Database {
 *   constructor(deps: DbDependency) {
 *     this.connect(deps.connectionString);
 *   }
 * }
 * ```
 */
export type Dependency<K extends string, V> = ...
```

**Symbol 2: AutoConstructor interface** (before line 5):
```typescript
/**
 * Interface for constructors that accept a dependency object.
 *
 * Defines the signature for class constructors that use dependency injection.
 * The constructor receives an object with all required dependencies and
 * returns an instance of the target type.
 *
 * @template D - Dependencies object type
 * @template T - Instance type returned by constructor
 *
 * @example
 * ```ts
 * type ServiceDeps = Dependency<'logger', Logger> & Dependency<'config', Config>;
 *
 * const ServiceConstructor: AutoConstructor<ServiceDeps, Service> = class Service {
 *   constructor(deps: ServiceDeps) {
 *     this.logger = deps.logger;
 *     this.config = deps.config;
 *   }
 * };
 * ```
 */
export interface AutoConstructor<D, T> {
```

**Symbol 3: Constructor interface** (before line 9):
```typescript
/**
 * Interface for constructors with no arguments.
 *
 * Defines the signature for zero-argument class constructors that don't
 * require dependency injection. Used by the constructor() helper to
 * differentiate between constructors with and without dependencies.
 *
 * @template T - Instance type returned by constructor
 *
 * @example
 * ```ts
 * const SimpleConstructor: Constructor<Logger> = class Logger {
 *   constructor() {
 *     this.startTime = Date.now();
 *   }
 * };
 * ```
 */
export interface Constructor<T> {
```

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compilation succeeds: `./run check`
- [ ] Tests pass: `./run test`
- [ ] All JSDoc comments are valid
- [ ] Publish succeeds in CI

#### Manual Verification:
- [ ] JSR score reaches 100% (17/17 points)
- [ ] Verify with: `curl -H 'accept: text/html' https://jsr.io/@bodar/yadic/score | grep -o '[0-9]*%'`
- [ ] All 11 symbols show documentation on JSR package page
- [ ] JSR reports 100% documentation coverage (11/11 symbols)
- [ ] types.ts shows module documentation on JSR package page
- [ ] All 3 symbols in types.ts show documentation on JSR

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the score reached 100% (17/17 points) before marking the task complete.

---

## Testing Strategy

### Unit Tests
- No new tests required - existing tests are comprehensive
- All tests must continue to pass after each phase
- Run with: `./run test`

### Manual Testing Steps
After each phase:
1. Verify CircleCI build completes successfully
2. Check JSR score page: `curl -H 'accept: text/html' https://jsr.io/@bodar/yadic/score`
3. Verify score increased by expected points
4. Check JSR package page for proper rendering of documentation
5. Test imports from JSR work correctly (after Phase 1)

### Score Verification Commands

**Check current score**:
```bash
curl -H 'accept: text/html' https://jsr.io/@bodar/yadic/score | grep -o '[0-9]*%'
```

**Check detailed breakdown**:
```bash
curl -H 'accept: text/html' https://jsr.io/@bodar/yadic/score
```

### Expected Score Progression
- Start: 47% (8/17 points)
- After Phase 1: 47% (no documentation added yet, just export fix)
- After Phase 2: 65% (+3 points: README + examples)
- After Phase 3: ~71-76% (partial credit: chain.ts module + 3 symbols documented)
- After Phase 4: ~82-88% (partial credit: LazyMap.ts module + 5 more symbols)
- After Phase 5: 100% (+remaining points: types.ts module + final 3 symbols)
- Final: 100% (17/17 points - all 11 symbols documented)

Note: JSR may award points incrementally or wait until all files have module docs. The exact progression may vary, but the final score will be 100%.

## Performance Considerations

- Documentation comments have no runtime performance impact
- JSDoc is stripped during transpilation
- No changes to actual implementation code
- Package size will increase slightly due to doc comments in source

## Migration Notes

No migration required - this is purely additive:
- Existing API remains unchanged
- No breaking changes
- All existing code continues to work
- Documentation enhances discovery but doesn't change behavior

## References

- Original research: `thoughts/shared/research/2025-10-24-issue-2-jsr-score.md`
- JSR score page: https://jsr.io/@bodar/yadic/score
- JSR package page: https://jsr.io/@bodar/yadic
- Related ticket (package structure): `thoughts/shared/tickets/issue-package-structure.md`
- Source files:
  - `packages/yadic/src/chain.ts:1-18`
  - `packages/yadic/src/LazyMap.ts:4-57`
  - `packages/yadic/src/types.ts:1-11`
- Test examples:
  - `packages/yadic/test/LazyMap.test.ts:6-110`
  - `packages/yadic/test/chain.test.ts:4-21`
- Publish script: `run:58-79`
- CI configuration: `.circleci/config.yml:1-15`
