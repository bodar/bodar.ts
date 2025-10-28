# bodar.ts
[![Build](https://github.com/bodar/bodar.ts/actions/workflows/build.yml/badge.svg)](https://github.com/bodar/bodar.ts/actions/workflows/build.yml)

A monorepo containing TypeScript libraries for functional programming, database access, and dependency injection.

## Packages

### [@bodar/totallylazy](./packages/totallylazy)
A comprehensive functional programming library providing composable predicates, transducers, parsers, comparators, and collection utilities. Features lazy evaluation, parser combinators, and a complete JSON grammar with JSDoc custom type support.

### [@bodar/lazyrecords](./packages/lazyrecords)
A type-safe SQL query builder that bridges functional programming with SQL. Convert functional predicates and transducers into parameterized SQL queries. Currently supports PostgreSQL with ANSI SQL foundations.

### [@bodar/yadic](./packages/yadic)
A lightweight dependency injection container with lazy initialization. Uses property getters that convert to immutable read-only properties on first access for optimal performance.

## Monorepo Structure

```
bodar.ts/
├── packages/           # All publishable packages
│   ├── totallylazy/   # Functional programming library
│   ├── lazyrecords/   # SQL query builder
│   └── yadic/         # Dependency injection
├── run                # Main build/test script
├── bootstrap.sh       # Auto-installs dependencies via mise
└── package.json       # Workspace configuration
```

## Quick Start

The `./run` command handles all build, test, and development tasks. On first use, it automatically installs all required dependencies using `mise`:

```bash
# Run tests
./run test

# Type check
./run check

# Run specific test file
./run test packages/totallylazy/test/predicates/EqualsPredicate.test.ts

# Development mode (watch)
./run dev

# Clean and rebuild
./run build

# Test with coverage
./run coverage
```

The bootstrap process installs the correct versions of all tools (Bun, Node, etc.) automatically—no manual setup required.

## Design Decisions

### No Barrel Files
This project does NOT use barrel files (index.ts files that re-export everything). Each module should be imported directly from its source file. Barrel files have several issues including circular dependencies, larger bundle sizes, and slower TypeScript compilation.

Top level tasks
* [x] Basic structure
* [x] Run script
  * [x] tests
  * [x] lint
  * [x] typecheck
  * [x] CI target
    * [x] Publish to JSR
    * [x] TSDoc/JSDoc
    * [ ] Tests -> Docs

* utterlyidle / http4d
